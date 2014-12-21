/*

 @source
 ## Types
 Types for use by FinanceSimulator

 This module is AMD compatible, and also works without it.

*/	

// Self calling anonymous function
(function(){

	/*
		@function
		@private 

		typesLib as a function allows us to decide whether or not to invoke it as AMD.

	*/
	function typesLib(){
		var 
			exports = {accounts:{}},
			nextTxId = 1;
		;

		with (exports){
			currency = exports.currency = {};
			exc = exports.exc = {};
			exc.Exception = Class(Error);
			exc.InterestInvalidDate = Class(exc.Exception, "InterestInvalidDate", "Could not initialize Interest(): Invalid Date")
			exc.UnorderedTransactions = Class(exc.Exception)

			/*
				@object BalanceTypes
			*/
			// Balance Types (Account Types) (Credit/Debit)
			exports.BalanceTypes = {
				Neutral:0,
				Asset:1,
				Liability:-1
			}

			// @class
			currency.USD = function(val){
				return parseFloat((val).toFixed(2));
			};

			// @class
			exports.Transaction = Class({
				init: function(){
					if (typeof this.amount != "number") this.amount = 0;
					if (!(this.date instanceof Date)) this.date = new Date();
					this._transaction_id = nextTxId++;
				}
			});

			// @class
			exports.Interest = Class({
				init: function(){
					if (!date.getDate()) throw InterestInvalidDate;
				}
			});

			// function Hive(){
			// 	var hive = {
			// 		items: arguments
			// 	};
			// 	methods = {};
			// 	for (item in hive.items){
			// 		for (method in hive.items[item]){
			// 			if (typeof hive.items[item][method] == 'function'){
			// 				hive[method] = function(){
			// 					for item
			// 				}
			// 			}
			// 		}
			// 	}
			// }

			exports.Account = Class({
				// @constructor
				init: function(){
					if (this._initialized) return;
					this._initialized = true;
					this._type = this._type;
					this.transactionHistory = [];
					this.interestHistory = [];
					this.startingBalance = this.startingBalance || 0;
					this.date = this.date || new Date();
					this.balance = 0;

					this.transaction(this.startingBalance, this.date, "Starting Balance");
					if (this.startingBalance != this.balance) {
						this.transaction(this.balance-this.startingBalance, this.date, "Starting Balance Adjustment");
					}

				},


				// @method @private
				// Adds a transaction to the history.
				_pushAscending: function(target, item, compareKey){
					if (
						target.length
						&& item[compareKey] < target[target.length-1][compareKey]
					){
						throw new exc.UnorderedTransactions;
					}

					target.push(item);

				},

				// @method
				// Stores the transaction and adjusts the balance
				transaction: function(amount, date, note){
					this.init()
					this._pushAscending(
						this.transactionHistory,
						new Transaction({
							amount:amount,
							balance:this.balance+amount,
							date:date,
							note:note,
							_account:this
						}),
					   "date");
					this.balance += amount
				},

				// @method
				// Send money to this account
				give: function(amount, date, note){
					this.transaction(amount*this.balanceType, date, note);
				},

				// @method
				// Take money from this account
				take: function(amount, date, note){
					this.transaction(amount*(-this.balanceType), date, note);
				},

				// @method
				// What does this account net for the owner's worth?
				worth: function(){
					return this.balance * this.balanceType;
				},

				// @method
				// Returns the sum of all transactions in the history
				sum: function(){
					var val = 0;
					for (i in this.transactionHistory) val += this.transactionHistory[i].amount;
					return val;
				},

				// @method
				applyInterest: function(date){
					if (typeof date == "undefined") date = new Date();
					if (!date.getDate()) throw new exc.InvalidDate;

					// Find the start date for this period
					console.warn("FIXME: Add support for interest rules (monthly/daily, etc)")

				},

				// @method
				calcBalance: function(date){
					if (!date){
						date = this.transactionHistory[this.transactionHistory.length-1];
					}

					var bal = 0;
					for (var i=0; i < this.transactionHistory.length; ++i){
						if (this.transactionHistory[i].date > date){ break; }
						bal += this.transactionHistory[i].amount;
					}

					return bal;
				},

				// @method
				getPeriod: function(start, end){
					var ret = [];
					var res = binaryFindAll(this.transactionHistory, function(it){
						if (it.date < start) return -1; // Doesn't match.  Look more to the right
						if (it.date > end) return 1; // Doesn't match. Look more to the left.
						return 0; // Matches. Keep it.
					});
					for (var i in res){ ret.push(this.transactionHistory[res[i]]); }
					return ret;
				},

				// @method
				getPeriodNet: function(start, end){
					var val = 0;
					this.getPeriod(start, end).forEach(function(it){
						val += it.amount;
					});
					return val;
				},

				// @method
				getPeriodNetWorth: function(start, end){
					return this.getPeriodNet(start, end) * this.balanceType;
				},

				// @prop
				_type: "Account",
				// @prop
				name: "Unnamed Account",
				// @prop
				startingBalance: 0,
				// @prop
				balance: 0,
				// @prop
				apr: 0

			});

			exports.Asset = exports.accounts.Asset = Class(Account, {
				_type: "Asset",
				balanceType: BalanceTypes.Asset,
				init: function(){
					this.SuperApply("init", arguments);
				}
			});

			exports.accounts.Liability = Class(Account, {
				_type: "Liability",
				balanceType: BalanceTypes.Liability
			});

			exports.accounts.Expense = Class(Account, {
				_type: "Expense",
				balanceType: BalanceTypes.Neutral
			})

			exports.accounts.Revenue = Class(Account, {
				_type: "Revenue",
				balanceType: BalanceTypes.Neutral
			})

			exports.accounts.Service = Class(exports.accounts.Expense, {
				_type: "Service"
			});

			exports.accounts.CreditCard = Class(exports.accounts.Liability, {
				_type: "Credit Card"
			});

			exports.accounts.BudgetItem = Class(exports.accounts.Expense, {
				_type: "Budget Item"
			});

			exports.accounts.Allowance = Class(exports.accounts.BudgetItem, {
				_type: "Allowance"
			});

			exports.Entity = Class({
				// @constructor
				init: function(){
					this.accounts = this.accounts || {}
					for (var k in this.accounts) if (!(this.accounts[k] instanceof exports.Account)) throw "This is not an Account: "+k
				},

				// @method
				// Calculates the current worth of this Entity
				worth: function(){
					var val = 0;
					for (var k in this.accounts){
						val += this.accounts[k].worth();
					}
					return val;
				},

				// @method
				// Aggrate, calculate the balance @ this date
				calcBalance: function(date){
					var val = 0;
					for (var k in this.accounts){
						val += (this.accounts[k].calcBalance(date) * this.accounts[k].balanceType);
					}
					return val;
				},

				// @method
				getPeriodNetWorth: function(start, end){

					var val = 0;
					for (var k in this.accounts){
						val += (this.accounts[k].getPeriodNetWorth(start, end));
					}
					return val;
				},

				// @method
				getTransactions: function(start, end){
					var
						acctk,
						transactions = []
					;
					for (var acctk in this.accounts){
						transactions = transactions.concat(this.accounts[acctk].getPeriod(start, end));
					}

					return transactions;
				},

				// @method
				// Finds an account by name
				findAccount: function(name){
					for (var i in this.accounts){
						if (this.accounts[i].name == name) return this.accounts[i];
					}
				}
			})
			exports.Person = Class(exports.Entity)

			exports.accountTypes = (function(){
				var res = []
				for (var k in exports.accounts){
					if (exports.accounts[k].prototype._type){
						res.push(exports.accounts[k].prototype._type);
					}
				}
				return res;
			})();

		}

		return exports;
	}

	console.log("FIXME: Test AMD style")
	if (typeof require!=="undefined" && typeof define!=="undefined" ){
		// Do this AMD style:

		define([], typesLib);
		return;

	} else {
		// Do this cowboy style.

		if (typeof _fisim ==='undefined') _fisim = {};
		_fisim.types = typesLib();
		return;
	}


})();