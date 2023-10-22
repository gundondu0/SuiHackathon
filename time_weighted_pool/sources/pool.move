module time_weighted_pool::pool{
    use sui::table::{Table, Self};
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::vector;
    use sui::sui::SUI;
    use sui::dynamic_object_field as ofield;
    use sui::dynamic_field as field;
    use sui::math;
    use std::type_name;
    const EWrongOrderOwner: u64 = 1;
    const EWrongTokenType:u64 = 2;
    const EWrongIntervalle:u64 = 3;
    const EWrongAmountToPut:u64 = 4;
    struct SwapperCap has key { id: UID }

    
    struct Pool<phantom COINA,phantom COINB> has key {
        id: UID,
        token_a_pool: Balance<COINA>,
        token_b_pool: Balance<COINB>,
        fee_payer:address,
        constant:u64,
        lp_adresses:vector<address>
    }
    struct LiqPro<phantom COINA,phantom COINB> has key,store {
        id: UID,
        a_token_amount:u64 ,
        b_token_amount:u64,
        lp_adress:address,
        tick_left:u64,
        tick_right:u64,

    }
    struct Order<phantom COINGIVE> has key,store{
        id:UID,
        order_owner:address,
        token_to_give:Balance<COINGIVE>,
        current_intervalle:u64,
        intervalle_balance_amount:u64,
        cooldown:u64,
        intervalle_amount:u64,
    }

    
    fun init(ctx: &mut TxContext) {
        transfer::transfer(SwapperCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx))
    }

    public entry fun create<COINA,COINB>(token_a_payment: &mut Coin<COINA>,token_b_payment: &mut Coin<COINB>,a_amount:u64,b_amount:u64,a:u64,b:u64,fee_payer:address,ctx: &mut TxContext) {


        let id = object::new(ctx);
        let token_a_pool:Balance<COINA> = balance::zero();
        let token_b_pool:Balance<COINB> = balance::zero();
        
        let coin_balance_a = coin::balance_mut(token_a_payment);
        let coin_balance_b = coin::balance_mut(token_b_payment);

        let constant = a*b;
        assert!((((a as u128) / (b as u128))) == (((a_amount as u128)/(b_amount as u128))), EWrongAmountToPut);
        let paid_a = balance::split(coin_balance_a, a_amount);
        let paid_b = balance::split(coin_balance_b, b_amount);
        let lp_adresses = vector::empty<address>();
        

        vector::push_back(&mut lp_adresses, tx_context::sender(ctx));

        balance::join(&mut token_a_pool, paid_a);
        balance::join(&mut token_b_pool, paid_b);
        transfer::share_object(Pool<COINA,COINB> { 
            id, 
            token_a_pool,
            token_b_pool,
            lp_adresses,
            fee_payer,
            constant
        });
    }

    public entry fun add_liqudity<COINA,COINB>(pool:&mut Pool<COINA,COINB>,token_a_payment: &mut Coin<COINA>,token_b_payment: &mut Coin<COINB>,a_amount:u64,b_amount:u64,ctx: &mut TxContext) {
       
        assert!(((a_amount as u128) / (b_amount as u128)) == ((balance::value(&pool.token_a_pool) as u128)/(balance::value(&pool.token_b_pool) as u128)), EWrongAmountToPut);//TODO: check if this is the right way to do it
        let coin_balance_a = coin::balance_mut(token_a_payment);
        let coin_balance_b = coin::balance_mut(token_b_payment);


        let paid_a = balance::split(coin_balance_a, a_amount);
        let paid_b = balance::split(coin_balance_b, b_amount);


        balance::join(&mut pool.token_a_pool, paid_a);
        balance::join(&mut pool.token_b_pool, paid_b);

        if(vector::contains(&pool.lp_adresses, &tx_context::sender(ctx))){
            let curr_lp = borrow_mut_lp_via_pool(pool, tx_context::sender(ctx));
            curr_lp.a_token_amount = curr_lp.a_token_amount + a_amount;
            curr_lp.b_token_amount = curr_lp.b_token_amount + b_amount;

        }else{
            let new_lp = LiqPro{
                id: object::new(ctx),
                a_token_amount: a_amount,
                b_token_amount: b_amount,
                lp_adress: tx_context::sender(ctx),
                tick_left:0,
                tick_right:0,
            };

            add_dof_lp(pool, new_lp, tx_context::sender(ctx));
            vector::push_back(&mut pool.lp_adresses, tx_context::sender(ctx));
            }
        }
    

    public entry fun next_swap<COINA,COINB,COINGIVE>(_:&SwapperCap,pool:&mut Pool<COINA,COINB>,order_owner:address, ctx:&mut TxContext){
        let order = ofield::borrow_mut<address,Order<COINGIVE>>(&mut pool.id, order_owner);
        assert!(order.current_intervalle < order.intervalle_amount, EWrongIntervalle);

        if(type_name::get<COINGIVE>()==type_name::get<COINA>()){
            let new_given_balance = balance::value(&pool.token_a_pool) + order.intervalle_balance_amount;
            let new_b_amount = pool.constant/new_given_balance;      
            let amount_to_give = balance::value(&pool.token_b_pool) - new_b_amount;
            let profits = coin::take(&mut pool.token_b_pool, amount_to_give, ctx);
            order.current_intervalle = order.current_intervalle + 1;

            transfer::public_transfer(profits, order.order_owner); 

        }else if(type_name::get<COINGIVE>()==type_name::get<COINB>()){
            let new_given_balance = balance::value(&pool.token_b_pool) + order.intervalle_balance_amount;
            let new_a_amount = pool.constant/new_given_balance;
            let amount_to_give = balance::value(&pool.token_a_pool) - new_a_amount;
            let profits = coin::take(&mut pool.token_a_pool, amount_to_give, ctx);
            order.current_intervalle = order.current_intervalle + 1;

            transfer::public_transfer(profits, order.order_owner);
        }else{
            assert!(false, EWrongTokenType);
        };

        }
   

    public entry fun create_order<COINA,COINB,COINGIVE>(pool:&mut Pool<COINA,COINB>,token_to_give: &mut Coin<COINGIVE>,given_amount:u64,cooldown:u64,intervalle_amount:u64, ctx:&mut TxContext){
         let intervalle_balance_amount = coin::value(token_to_give)/intervalle_amount;
        assert!(type_name::get<COINGIVE>() == type_name::get<COINA>() || type_name::get<COINGIVE>() == type_name::get<COINA>(), EWrongTokenType);

        if(ofield::exists_(&pool.id,tx_context::sender(ctx))){
            let curr_order = borrow_order_via_pool<COINA,COINB,COINGIVE>(pool,tx_context::sender(ctx));
            assert!(balance::value(&curr_order.token_to_give)==0, EWrongOrderOwner);
            balance::join(&mut curr_order.token_to_give, coin::into_balance(coin::split(token_to_give,(given_amount-((((given_amount*3) as u128)/(100 as u128)) as u64)),ctx)));
            curr_order.cooldown = cooldown;
            curr_order.intervalle_amount = intervalle_amount;
            curr_order.intervalle_balance_amount = intervalle_balance_amount;
            curr_order.current_intervalle = 0;
        }else{
        let created_order = Order<COINGIVE> {
            id: object::new(ctx),
            order_owner: tx_context::sender(ctx),
            token_to_give: balance::split(coin::balance_mut(token_to_give), given_amount-(((given_amount*3) as u128)/(100 as u128) as u64)),
            current_intervalle: 0,
            cooldown,
            intervalle_balance_amount,
            intervalle_amount
        };
        let lp_reward = coin::split(token_to_give, (((given_amount*3) as u128)/(100 as u128) as u64), ctx);
        let total_reward = coin::value(&lp_reward);
        // let i =0;
        // while(i < vector::length(&pool.lp_adresses)){
        //     let curr_lp_address = *vector::borrow(&pool.lp_adresses, i);
        //     let curr_lp = ofield::borrow_mut<address,LiqPro<COINA,COINB>>(&mut pool.id, curr_lp_address);
        //     let curr_lp_reward = coin::split(&mut lp_reward,(total_reward*((((curr_lp.a_token_amount) as u128)/(balance::value(&pool.token_a_pool) as u128)) as u64)), ctx);
        //     i= i+1;
        //     transfer::public_transfer(curr_lp_reward, curr_lp_address);
        // };
        transfer::public_transfer(lp_reward, pool.fee_payer);
        add_dof_order(pool, created_order, tx_context::sender(ctx));
        }





    }

     public entry fun withdraw_order<COINA,COINB,COINGIVE>(order:&mut Order<COINGIVE>,ctx:&mut TxContext){
        assert!(tx_context::sender(ctx) == order.order_owner, EWrongOrderOwner);      
        let retrun = balance::withdraw_all(&mut order.token_to_give);
        let coins = coin::from_balance(retrun,ctx);
        transfer::public_transfer(coins, order.order_owner);      
        }
    // public entry fun remove_order<COINA,COINB,COINGIVE>(pool:&mut Pool<COINA,COINB>,order: Order<COINGIVE>,ctx:&mut TxContext){
    //      let Order {id,token_to_give,cooldown:_,current_intervalle:_,order_owner:_,intervalle_amount:_,intervalle_balance_amount:_} = order;
    //     balance::destroy_zero<COINGIVE>(token_to_give);
    //     object::delete(id);


    // }
    public fun add_dof_order<COINA,COINB,COINGIVE>(pool:&mut Pool<COINA,COINB>, order: Order<COINGIVE>, order_owner: address) {
        ofield::add(&mut pool.id, order_owner, order);
    } 

     public fun add_dof_lp<COINA,COINB>(pool:&mut Pool<COINA,COINB>, lp: LiqPro<COINA,COINB>, lp_address: address) {
        ofield::add(&mut pool.id, lp_address, lp);
    } 
    public fun borrow_order_via_pool<COINA,COINB,COINGIVE>(pool: &mut Pool<COINA,COINB>, order_owner: address): &mut Order<COINGIVE> {
        ofield::borrow_mut<address,Order<COINGIVE>>(&mut pool.id, order_owner)
    }
    public fun borrow_mut_lp_via_pool<COINA,COINB>(pool: &mut Pool<COINA,COINB>, lp_address: address): &mut LiqPro<COINA,COINB> {
        ofield::borrow_mut<address,LiqPro<COINA,COINB>>(&mut pool.id, lp_address)
    }
}