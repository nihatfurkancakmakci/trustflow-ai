#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ArbitrationError {
    AlreadyInitialized = 1,
    NotFound = 2,
    Unauthorized = 3,
    AlreadyResolved = 4,
    InvalidDecision = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Decision {
    Pending = 0,
    FavorClient = 1,
    FavorFreelancer = 2,
    SplitFunds = 3,
}

#[contracttype]
#[derive(Clone)]
pub struct Dispute {
    pub escrow_contract: Address,
    pub job_id: String,
    pub milestone_index: u32,
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub amount: i128,
    pub arbiter: Address,
    pub decision: Decision,
    pub reason: String,
}

#[contracttype]
#[derive(Clone)]
pub enum DisputeKey {
    DisputeId(String),
    Arbiter,
}

#[contract]
pub struct TrustFlowArbitration;

#[contractimpl]
impl TrustFlowArbitration {
    /// Set the arbiter (admin) for this contract. Called once.
    pub fn initialize(env: Env, arbiter: Address) -> Result<(), ArbitrationError> {
        if env.storage().instance().has(&DisputeKey::Arbiter) {
            return Err(ArbitrationError::AlreadyInitialized);
        }
        env.storage().instance().set(&DisputeKey::Arbiter, &arbiter);
        env.events().publish((symbol_short!("arb_init"),), arbiter);
        Ok(())
    }

    /// Open a dispute — called by the Escrow contract via cross-contract call.
    /// This is the CROSS-CONTRACT COMMUNICATION entry point.
    pub fn open_dispute(
        env: Env,
        dispute_id: String,
        escrow_contract: Address,
        job_id: String,
        milestone_index: u32,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
    ) -> Result<(), ArbitrationError> {
        // The escrow contract (caller) must authorize
        escrow_contract.require_auth();

        let key = DisputeKey::DisputeId(dispute_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(ArbitrationError::AlreadyInitialized);
        }

        let arbiter: Address = env.storage().instance().get(&DisputeKey::Arbiter)
            .ok_or(ArbitrationError::NotFound)?;

        let dispute = Dispute {
            escrow_contract,
            job_id: job_id.clone(),
            milestone_index,
            client,
            freelancer,
            token,
            amount,
            arbiter,
            decision: Decision::Pending,
            reason: String::from_str(&env, ""),
        };

        env.storage().persistent().set(&key, &dispute);
        env.events().publish(
            (symbol_short!("dispute"), dispute_id),
            Decision::Pending,
        );

        Ok(())
    }

    /// Arbiter resolves the dispute with a decision.
    /// Funds are distributed based on the decision.
    pub fn resolve_dispute(
        env: Env,
        dispute_id: String,
        decision: Decision,
        reason: String,
    ) -> Result<(), ArbitrationError> {
        let arbiter: Address = env.storage().instance().get(&DisputeKey::Arbiter)
            .ok_or(ArbitrationError::NotFound)?;
        arbiter.require_auth();

        let key = DisputeKey::DisputeId(dispute_id.clone());
        let mut dispute: Dispute = env.storage().persistent().get(&key)
            .ok_or(ArbitrationError::NotFound)?;

        if dispute.decision != Decision::Pending {
            return Err(ArbitrationError::AlreadyResolved);
        }

        if decision == Decision::Pending {
            return Err(ArbitrationError::InvalidDecision);
        }

        let token_client = token::Client::new(&env, &dispute.token);

        match decision {
            Decision::FavorClient => {
                // Refund 100% to client
                token_client.transfer(
                    &env.current_contract_address(),
                    &dispute.client,
                    &dispute.amount,
                );
            }
            Decision::FavorFreelancer => {
                // Pay 100% to freelancer
                token_client.transfer(
                    &env.current_contract_address(),
                    &dispute.freelancer,
                    &dispute.amount,
                );
            }
            Decision::SplitFunds => {
                // 50/50 split
                let half = dispute.amount / 2;
                let remainder = dispute.amount - half;
                token_client.transfer(
                    &env.current_contract_address(),
                    &dispute.client,
                    &half,
                );
                token_client.transfer(
                    &env.current_contract_address(),
                    &dispute.freelancer,
                    &remainder,
                );
            }
            _ => return Err(ArbitrationError::InvalidDecision),
        }

        dispute.decision = decision.clone();
        dispute.reason = reason;
        env.storage().persistent().set(&key, &dispute);

        env.events().publish(
            (symbol_short!("resolved"), dispute_id),
            decision,
        );

        Ok(())
    }

    /// View a dispute's current state (read-only)
    pub fn get_dispute(env: Env, dispute_id: String) -> Result<Dispute, ArbitrationError> {
        let key = DisputeKey::DisputeId(dispute_id);
        env.storage().persistent().get(&key).ok_or(ArbitrationError::NotFound)
    }
}
