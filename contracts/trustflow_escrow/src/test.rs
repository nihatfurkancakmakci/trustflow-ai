#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token, vec, Address, Env, String,
};

fn setup_env() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    
    // Create a test token
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract.address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);
    
    // Mint tokens to client
    token_admin_client.mint(&client, &10_000_000_000); // 1000 XLM (7 decimals)
    
    (env, client, freelancer, token_address, admin)
}

#[test]
fn test_init_escrow_success() {
    let (env, client, freelancer, token, _admin) = setup_env();
    let contract_id = env.register(TrustFlowEscrow, ());
    
    let amounts = vec![&env, 100_0000000i128, 200_0000000i128]; // 100 + 200 XLM
    let deadlines = vec![&env, 1_700_000_000u64, 1_700_100_000u64];
    let job_id = String::from_str(&env, "test_job_1");
    
    let result = TrustFlowEscrowClient::new(&env, &contract_id).init_escrow(
        &job_id,
        &client,
        &freelancer,
        &token,
        &amounts,
        &deadlines,
        &2u32,
    );
    
    // Should succeed without error
    assert_eq!(result, ());
    
    // Verify token was transferred from client to contract
    let token_client = token::Client::new(&env, &token);
    let contract_balance = token_client.balance(&contract_id);
    assert_eq!(contract_balance, 300_0000000i128); // 300 XLM total
}

#[test]
fn test_submit_and_approve_milestone() {
    let (env, client, freelancer, token, _admin) = setup_env();
    let contract_id = env.register(TrustFlowEscrow, ());
    let escrow_client = TrustFlowEscrowClient::new(&env, &contract_id);
    
    let amounts = vec![&env, 100_0000000i128, 200_0000000i128];
    let deadlines = vec![&env, 1_700_000_000u64, 1_700_100_000u64];
    let job_id = String::from_str(&env, "test_job_2");
    
    // Init
    escrow_client.init_escrow(
        &job_id, &client, &freelancer, &token,
        &amounts, &deadlines, &2u32,
    );
    
    // Freelancer submits milestone 0
    escrow_client.submit_milestone(&job_id, &0u32);
    
    // Client approves milestone 0
    let freelancer_balance_before = token::Client::new(&env, &token).balance(&freelancer);
    escrow_client.approve_milestone(&job_id, &0u32);
    let freelancer_balance_after = token::Client::new(&env, &token).balance(&freelancer);
    
    // Freelancer should receive 100 XLM
    assert_eq!(freelancer_balance_after - freelancer_balance_before, 100_0000000i128);
}

#[test]
fn test_request_revision_and_resubmit() {
    let (env, client, freelancer, token, _admin) = setup_env();
    let contract_id = env.register(TrustFlowEscrow, ());
    let escrow_client = TrustFlowEscrowClient::new(&env, &contract_id);
    
    let amounts = vec![&env, 500_0000000i128];
    let deadlines = vec![&env, 1_700_000_000u64];
    let job_id = String::from_str(&env, "test_job_3");
    
    escrow_client.init_escrow(
        &job_id, &client, &freelancer, &token,
        &amounts, &deadlines, &2u32,
    );
    
    // Freelancer submits
    escrow_client.submit_milestone(&job_id, &0u32);
    
    // Client requests revision
    escrow_client.request_revision(&job_id, &0u32);
    
    // Freelancer resubmits after revision
    escrow_client.submit_milestone(&job_id, &0u32);
    
    // Client approves this time
    escrow_client.approve_milestone(&job_id, &0u32);
    
    // Freelancer should receive the 500 XLM
    let freelancer_balance = token::Client::new(&env, &token).balance(&freelancer);
    assert_eq!(freelancer_balance, 500_0000000i128);
}

#[test]
fn test_raise_dispute() {
    let (env, client, freelancer, token, _admin) = setup_env();
    let contract_id = env.register(TrustFlowEscrow, ());
    let escrow_client = TrustFlowEscrowClient::new(&env, &contract_id);
    
    let amounts = vec![&env, 100_0000000i128];
    let deadlines = vec![&env, 1_700_000_000u64];
    let job_id = String::from_str(&env, "test_job_4");
    
    escrow_client.init_escrow(
        &job_id, &client, &freelancer, &token,
        &amounts, &deadlines, &1u32,
    );
    
    // Freelancer submits milestone
    escrow_client.submit_milestone(&job_id, &0u32);
    
    // Raise dispute on milestone 0
    escrow_client.raise_dispute(&job_id, &0u32);
    
    // Funds should still be locked in contract (not released)
    let token_client = token::Client::new(&env, &token);
    let contract_balance = token_client.balance(&contract_id);
    assert_eq!(contract_balance, 100_0000000i128);
}

#[test]
fn test_auto_approve_after_timeout() {
    let (env, client, freelancer, token, _admin) = setup_env();
    let contract_id = env.register(TrustFlowEscrow, ());
    let escrow_client = TrustFlowEscrowClient::new(&env, &contract_id);
    
    let amounts = vec![&env, 250_0000000i128];
    let deadlines = vec![&env, 1_700_000_000u64];
    let job_id = String::from_str(&env, "test_job_5");
    
    // Set initial ledger time
    env.ledger().set(LedgerInfo {
        timestamp: 1_699_900_000,
        protocol_version: 22,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10_000,
        min_persistent_entry_ttl: 10_000,
        max_entry_ttl: 100_000,
    });
    
    escrow_client.init_escrow(
        &job_id, &client, &freelancer, &token,
        &amounts, &deadlines, &1u32,
    );
    
    // Freelancer submits
    escrow_client.submit_milestone(&job_id, &0u32);
    
    // Fast-forward time past AUTO_APPROVE_PERIOD (14 days)
    env.ledger().set(LedgerInfo {
        timestamp: 1_699_900_000 + AUTO_APPROVE_PERIOD + 1,
        protocol_version: 22,
        sequence_number: 101, // Keep sequence increments small to prevent archiving key in tests
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10_000,
        min_persistent_entry_ttl: 10_000,
        max_entry_ttl: 100_000,
    });
    
    // Auto approve should succeed now
    escrow_client.auto_approve_milestone(&job_id, &0u32);
    
    // Freelancer should receive 250 XLM
    let freelancer_balance = token::Client::new(&env, &token).balance(&freelancer);
    assert_eq!(freelancer_balance, 250_0000000i128);
}

#[test]
fn test_cancel_and_refund_after_deadline() {
    let (env, client, freelancer, token, _admin) = setup_env();
    let contract_id = env.register(TrustFlowEscrow, ());
    let escrow_client = TrustFlowEscrowClient::new(&env, &contract_id);
    
    let deadline = 1_700_000_000u64;
    let amounts = vec![&env, 300_0000000i128];
    let deadlines = vec![&env, deadline];
    let job_id = String::from_str(&env, "test_job_6");
    
    env.ledger().set(LedgerInfo {
        timestamp: 1_699_500_000,
        protocol_version: 22,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10_000,
        min_persistent_entry_ttl: 10_000,
        max_entry_ttl: 100_000,
    });
    
    let client_balance_before = token::Client::new(&env, &token).balance(&client);
    
    escrow_client.init_escrow(
        &job_id, &client, &freelancer, &token,
        &amounts, &deadlines, &1u32,
    );
    
    // Fast-forward past deadline + GRACE_PERIOD
    env.ledger().set(LedgerInfo {
        timestamp: deadline + GRACE_PERIOD + 1,
        protocol_version: 22,
        sequence_number: 101, // Keep sequence increments small to prevent archiving key in tests
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10_000,
        min_persistent_entry_ttl: 10_000,
        max_entry_ttl: 100_000,
    });
    
    // Client cancels and refunds
    escrow_client.cancel_and_refund(&job_id, &0u32);
    
    // Client should get 300 XLM back
    let client_balance_after = token::Client::new(&env, &token).balance(&client);
    assert_eq!(client_balance_after, client_balance_before);
}
