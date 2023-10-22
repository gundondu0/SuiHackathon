// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Example coin with a trusted manager responsible for minting/burning (e.g., a stablecoin)
/// By convention, modules defining custom coin types use upper case names, in contrast to
/// ordinary modules, which use camel case.
module time_weighted_pool::utility_token {
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use time_weighted_pool::drand_lib::{verify_drand_signature, derive_randomness, safe_selection};

    /// Name of the coin. By convention, this type has the same name as its parent module
    /// and has no fields. The full type of the coin defined by this module will be `COIN<MANAGED>`.
    struct UTILITY_TOKEN has drop {}

    #[allow(unused_function)]
    /// Register the managed currency to acquire its `TreasuryCap`. Because
    /// this is a module initializer, it ensures the currency only gets
    /// registered once.
    fun init(witness: UTILITY_TOKEN, ctx: &mut TxContext) {
        // Get a treasury cap for the coin and give it to the transaction sender
        let (treasury_cap, metadata) = coin::create_currency<UTILITY_TOKEN>(witness, 1, b"C", b"", b"", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx))
    }

    /// Manager can mint new coins
    public entry fun mint(
        treasury_cap: &mut TreasuryCap<UTILITY_TOKEN>,recipient: address,round:u64, drand_sig: vector<u8>, drand_prev_sig: vector<u8>,n:u64, ctx: &mut TxContext
    ) {
        verify_drand_signature(drand_sig, drand_prev_sig, round);
        let digest = derive_randomness(drand_sig);
        let selected_num = safe_selection(n, &digest);
        coin::mint_and_transfer(treasury_cap, selected_num, recipient, ctx)
    }

    /// Manager can burn coins
    public entry fun burn(treasury_cap: &mut TreasuryCap<UTILITY_TOKEN>, coin: Coin<UTILITY_TOKEN>) {
        coin::burn(treasury_cap, coin);
    }

    #[test_only]
    /// Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(UTILITY_TOKEN {}, ctx)
    }
}