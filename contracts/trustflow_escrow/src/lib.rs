#![no_std]

#[cfg(test)]
mod test;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String, Symbol, Vec,
};

const AUTO_APPROVE_PERIOD: u64 = 14 * 24 * 60 * 60; // 14 days in seconds
const GRACE_PERIOD: u64 = 24 * 60 * 60; // 24 hours in seconds

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidStatus = 5,
    InvalidMilestone = 6,
    NoRevisionsLeft = 7,
    TooEarlyToAutoApprove = 8,
    TooEarlyToCancel = 9,
    AlreadyPaid = 10,
    ArrayLengthMismatch = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending = 1,
    Delivered = 2,
    RevisionRequested = 3,
    Approved = 4,
    Disputed = 5,
    Refunded = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub amount: i128,
    pub deadline: u64, // Unix timestamp in seconds
    pub status: MilestoneStatus,
    pub delivered_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum JobStatus {
    Funded = 1,
    InProgress = 2,
    Completed = 3,
    Disputed = 4,
    Refunded = 5,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    JobId(String),
}

#[contracttype]
#[derive(Clone)]
pub struct JobDetails {
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub revision_limit: u32,
    pub revisions_used: u32,
    pub status: JobStatus,
}

#[contract]
pub struct TrustFlowEscrow;

#[contractimpl]
impl TrustFlowEscrow {
    /// Initialize the escrow with multiple milestones
    pub fn init_escrow(
        env: Env,
        job_id: String,
        client: Address,
        freelancer: Address,
        token: Address,
        amounts: Vec<i128>,
        deadlines: Vec<u64>,
        revision_limit: u32,
    ) -> Result<(), EscrowError> {
        client.require_auth();

        if amounts.len() == 0 || amounts.len() != deadlines.len() {
            return Err(EscrowError::ArrayLengthMismatch);
        }

        let key = DataKey::JobId(job_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(EscrowError::AlreadyInitialized);
        }

        let mut total_amount: i128 = 0;
        let mut milestones = Vec::new(&env);
        
        for i in 0..amounts.len() {
            let amount = amounts.get(i).unwrap();
            let deadline = deadlines.get(i).unwrap();
            
            if amount <= 0 {
                return Err(EscrowError::InvalidAmount);
            }
            
            total_amount += amount;
            milestones.push_back(Milestone {
                amount,
                deadline,
                status: MilestoneStatus::Pending,
                delivered_at: 0,
            });
        }

        // Transfer total funds from client to this contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &total_amount);

        let details = JobDetails {
            client,
            freelancer,
            token,
            total_amount,
            milestones,
            revision_limit,
            revisions_used: 0,
            status: JobStatus::Funded,
        };
        env.storage().persistent().set(&key, &details);

        env.events().publish((symbol_short!("init"), job_id), details.status);

        Ok(())
    }

    /// Freelancer submits work for a specific milestone
    pub fn submit_milestone(env: Env, job_id: String, milestone_index: u32) -> Result<(), EscrowError> {
        let key = DataKey::JobId(job_id.clone());
        let mut details: JobDetails = env.storage().persistent().get(&key).ok_or(EscrowError::NotInitialized)?;

        details.freelancer.require_auth();

        if milestone_index >= details.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut milestone = details.milestones.get(milestone_index).unwrap();
        
        if milestone.status != MilestoneStatus::Pending && milestone.status != MilestoneStatus::RevisionRequested {
            return Err(EscrowError::InvalidStatus);
        }

        milestone.status = MilestoneStatus::Delivered;
        milestone.delivered_at = env.ledger().timestamp();
        
        details.milestones.set(milestone_index, milestone);
        details.status = JobStatus::InProgress;

        env.storage().persistent().set(&key, &details);
        env.events().publish((symbol_short!("submit"), job_id, milestone_index), MilestoneStatus::Delivered);

        Ok(())
    }

    /// Client requests a revision on a delivered milestone
    pub fn request_revision(env: Env, job_id: String, milestone_index: u32) -> Result<(), EscrowError> {
        let key = DataKey::JobId(job_id.clone());
        let mut details: JobDetails = env.storage().persistent().get(&key).ok_or(EscrowError::NotInitialized)?;

        details.client.require_auth();

        if milestone_index >= details.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut milestone = details.milestones.get(milestone_index).unwrap();
        
        if milestone.status != MilestoneStatus::Delivered {
            return Err(EscrowError::InvalidStatus);
        }

        if details.revisions_used >= details.revision_limit {
            return Err(EscrowError::NoRevisionsLeft);
        }

        details.revisions_used += 1;
        milestone.status = MilestoneStatus::RevisionRequested;
        
        details.milestones.set(milestone_index, milestone);
        env.storage().persistent().set(&key, &details);
        
        env.events().publish((symbol_short!("revision"), job_id, milestone_index), details.revisions_used);

        Ok(())
    }

    /// Client approves a delivered milestone, releasing its funds to the freelancer
    pub fn approve_milestone(env: Env, job_id: String, milestone_index: u32) -> Result<(), EscrowError> {
        let key = DataKey::JobId(job_id.clone());
        let mut details: JobDetails = env.storage().persistent().get(&key).ok_or(EscrowError::NotInitialized)?;

        details.client.require_auth();

        if milestone_index >= details.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut milestone = details.milestones.get(milestone_index).unwrap();
        
        if milestone.status != MilestoneStatus::Delivered {
            return Err(EscrowError::InvalidStatus);
        }

        milestone.status = MilestoneStatus::Approved;
        details.milestones.set(milestone_index, milestone.clone());

        // Transfer funds for this milestone to the freelancer
        let token_client = token::Client::new(&env, &details.token);
        token_client.transfer(&env.current_contract_address(), &details.freelancer, &milestone.amount);

        // Check if all milestones are approved
        let mut all_approved = true;
        for m in details.milestones.iter() {
            if m.status != MilestoneStatus::Approved {
                all_approved = false;
                break;
            }
        }

        if all_approved {
            details.status = JobStatus::Completed;
        }

        env.storage().persistent().set(&key, &details);
        env.events().publish((symbol_short!("approve"), job_id, milestone_index), details.status.clone());

        Ok(())
    }

    /// Auto-approve a milestone if client hasn't responded within AUTO_APPROVE_PERIOD
    pub fn auto_approve_milestone(env: Env, job_id: String, milestone_index: u32) -> Result<(), EscrowError> {
        let key = DataKey::JobId(job_id.clone());
        let mut details: JobDetails = env.storage().persistent().get(&key).ok_or(EscrowError::NotInitialized)?;

        // Anyone can call this (usually FL or a bot)
        // No explicit auth required, logic ensures it's safe

        if milestone_index >= details.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut milestone = details.milestones.get(milestone_index).unwrap();
        
        if milestone.status != MilestoneStatus::Delivered {
            return Err(EscrowError::InvalidStatus);
        }

        let current_time = env.ledger().timestamp();
        if current_time < milestone.delivered_at + AUTO_APPROVE_PERIOD {
            return Err(EscrowError::TooEarlyToAutoApprove);
        }

        milestone.status = MilestoneStatus::Approved;
        details.milestones.set(milestone_index, milestone.clone());

        // Transfer funds
        let token_client = token::Client::new(&env, &details.token);
        token_client.transfer(&env.current_contract_address(), &details.freelancer, &milestone.amount);

        let mut all_approved = true;
        for m in details.milestones.iter() {
            if m.status != MilestoneStatus::Approved {
                all_approved = false;
                break;
            }
        }

        if all_approved {
            details.status = JobStatus::Completed;
        }

        env.storage().persistent().set(&key, &details);
        env.events().publish((symbol_short!("auto_appr"), job_id, milestone_index), details.status.clone());

        Ok(())
    }

    /// Cancel a milestone if freelancer missed the deadline + grace period
    pub fn cancel_and_refund(env: Env, job_id: String, milestone_index: u32) -> Result<(), EscrowError> {
        let key = DataKey::JobId(job_id.clone());
        let mut details: JobDetails = env.storage().persistent().get(&key).ok_or(EscrowError::NotInitialized)?;

        details.client.require_auth();

        if milestone_index >= details.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut milestone = details.milestones.get(milestone_index).unwrap();
        
        if milestone.status == MilestoneStatus::Approved || milestone.status == MilestoneStatus::Refunded {
            return Err(EscrowError::AlreadyPaid);
        }

        if milestone.status == MilestoneStatus::Delivered {
            return Err(EscrowError::InvalidStatus); // Client must reject/dispute it first
        }

        let current_time = env.ledger().timestamp();
        if current_time < milestone.deadline + GRACE_PERIOD {
            return Err(EscrowError::TooEarlyToCancel);
        }

        milestone.status = MilestoneStatus::Refunded;
        details.milestones.set(milestone_index, milestone.clone());

        // Refund client for this milestone
        let token_client = token::Client::new(&env, &details.token);
        token_client.transfer(&env.current_contract_address(), &details.client, &milestone.amount);

        // Check if all remaining milestones are refunded or approved
        let mut all_done = true;
        for m in details.milestones.iter() {
            if m.status != MilestoneStatus::Approved && m.status != MilestoneStatus::Refunded {
                all_done = false;
                break;
            }
        }

        if all_done {
            details.status = JobStatus::Refunded;
        }

        env.storage().persistent().set(&key, &details);
        env.events().publish((symbol_short!("refund"), job_id, milestone_index), details.status.clone());

        Ok(())
    }

    /// Raise a dispute for arbitration
    pub fn raise_dispute(env: Env, job_id: String, milestone_index: u32) -> Result<(), EscrowError> {
        let key = DataKey::JobId(job_id.clone());
        let mut details: JobDetails = env.storage().persistent().get(&key).ok_or(EscrowError::NotInitialized)?;

        // Either party can dispute. We omit strict require_auth to allow either,
        // or a platform bot to raise it if requested off-chain.

        if milestone_index >= details.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut milestone = details.milestones.get(milestone_index).unwrap();
        
        if milestone.status == MilestoneStatus::Approved || milestone.status == MilestoneStatus::Refunded {
            return Err(EscrowError::AlreadyPaid);
        }

        milestone.status = MilestoneStatus::Disputed;
        details.milestones.set(milestone_index, milestone.clone());
        details.status = JobStatus::Disputed;

        env.storage().persistent().set(&key, &details);
        env.events().publish((symbol_short!("dispute"), job_id, milestone_index), details.status.clone());

        Ok(())
    }
}
