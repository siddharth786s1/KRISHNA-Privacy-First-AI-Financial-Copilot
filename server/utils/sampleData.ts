import { Transaction } from '../../src/types';

export function getSampleTransactions(): Transaction[] {
  return [
    { id: '1', date: '2026-05-01', description: 'Salary Credit Corp Ref DEP-99382173 text to 9876543210', amount: 95000 },
    { id: '2', date: '2026-05-02', description: 'E-Transfer Rent payment owner_john@gmail.com', amount: -28000 },
    { id: '3', date: '2026-05-03', description: 'DMART GROCERY STORE MUM', amount: -4500 },
    { id: '4', date: '2026-05-04', description: 'SWIGGY ORDER FOOD MUM ID-98217621', amount: -850 },
    { id: '5', date: '2026-05-05', description: 'UBER TRIP INDIA MUM AMNT', amount: -450 },
    { id: '6', date: '2026-05-05', description: 'NETFLIX ENTERTAINMENT SUBSCRIPTION NY US', amount: -399 },
    { id: '7', date: '2026-05-06', description: 'ZOMATO ONLINE FOOD ORDER raman@upi', amount: -1200 },
    { id: '8', date: '2026-05-06', description: 'ELECTRICITY BOARD SOUTH TECH BILL SEC-112', amount: -3200 },
    { id: '9', date: '2026-05-07', description: 'AMAZON IN Shopping Cart REF-98317203719', amount: -5800 },
    { id: '10', date: '2026-05-08', description: 'APOLLO PHARMACY DRUG STORE MUM', amount: -1500 },
    { id: '11', date: '2026-05-10', description: 'INTERNET RECHARGE FIBER broadband-pay@upi', amount: -999 },
    { id: '12', date: '2026-05-11', description: 'OLA CABS TRAVEL BANGALORE', amount: -350 },
    { id: '13', date: '2026-05-12', description: 'TRANSFER TO FRIEND ACCT 317283712891 rahul@upi', amount: -2000 },
    { id: '14', date: '2026-05-14', description: 'BIGBASKET GROCERIES RETAIL PVT', amount: -3150 },
    { id: '15', date: '2026-05-15', description: 'SWIGGY ORDER FOOD MUM ID-11204891', amount: -950 },
    { id: '16', date: '2026-05-16', description: 'SPOTIFY PREMIUM SUBSCRIPTION SE', amount: -149 },
    { id: '17', date: '2026-05-17', description: 'GAS RECHARGE GAIL PETROLEUM SEC-9', amount: -1400 },
    { id: '18', date: '2026-05-18', description: 'Lenskart Shopping MUM ST', amount: -2400 },
    { id: '19', date: '2026-05-20', description: 'ZOMATO ONLINE FOOD ORDER aniket@upi', amount: -1450 },
    { id: '20', date: '2026-05-21', description: 'HDFC INSURANCE PREMIUM ANNUAL LIFE', amount: -8500 },
    { id: '21', date: '2026-05-22', description: 'CREDIT CARD OUTSTANDING TRANSFER REF9921', amount: -15000 },
    { id: '22', date: '2026-05-24', description: 'SWIGGY FOOD ORDER ID-44218903', amount: -1100 },
    { id: '23', date: '2026-05-25', description: 'METRO RAIL TRAVEL TICKET MUM', amount: -120 },
    { id: '24', date: '2026-05-26', description: 'STARBUCKS COFFEE IND', amount: -650 },
    { id: '25', date: '2026-05-27', description: 'SOCIETY MAINTENANCE RENT HOUSING DEPT', amount: -6000 },
    { id: '26', date: '2026-05-28', description: 'AMAZON IN Shopping Cart ADD-ON', amount: -1150 },
    { id: '27', date: '2026-05-29', description: 'SWIGGY INSTAMART GROCERY ORDER', amount: -2100 },
    { id: '28', date: '2026-05-30', description: 'YOUTUBE PREMIUM IND INDIV SUBSCRIPTION', amount: -189 }
  ];
}

export type GoldenRow = { description: string; expected_category: string };

export function getGoldenDataset(): GoldenRow[] {
  return [
    // Income
    { description: 'Salary Credit Corp Ref DEP-99382173', expected_category: 'Income' },
    { description: 'Salary Deposit Tech Solution Ltd', expected_category: 'Income' },
    { description: 'FREELANCE PAYPAL CONSULTING WORK', expected_category: 'Income' },
    { description: 'PROMOTIONAL BONUS CREDIT FROM BANK', expected_category: 'Income' },
    { description: 'DIVIDEND PAYOUT INVESTMENTS', expected_category: 'Income' },
    { description: 'MONTHLY COMPENSATION DEPT FINANCE', expected_category: 'Income' },
    { description: 'STRIPE PAYOUT GUMROAD SALES', expected_category: 'Income' },
    { description: 'FIVERR GIG PAYOUT TRANSFER', expected_category: 'Income' },
    { description: 'CASHBACK VOUCHER REDEEM CREDIT', expected_category: 'Income' },
    { description: 'INTEREST CREDIT SAVINGS ACCOUNT', expected_category: 'Income' },

    // Housing/Rent
    { description: 'Rent payment owner_john@gmail.com', expected_category: 'Housing/Rent' },
    { description: 'MONTHLY LEASE FLAT 402 PAYMENT', expected_category: 'Housing/Rent' },
    { description: 'NESTAWAY RENTAL DEPOSIT APARTMENT', expected_category: 'Housing/Rent' },
    { description: 'SOCIETY MAINTENANCE CHARGE SEC-9', expected_category: 'Housing/Rent' },
    { description: 'BROKERAGE FEE RENT PROP COMP', expected_category: 'Housing/Rent' },
    { description: 'STAYABODE PG HOUSING CO‑LIVING', expected_category: 'Housing/Rent' },
    { description: 'ZOLO STAYS MONTHLY ACCOMMODATION', expected_category: 'Housing/Rent' },
    { description: 'HOUSE OWNERSHIP LOAN EMI REPAY', expected_category: 'Housing/Rent' },
    { description: 'HOME LOAN INTEREST CHARGES HDFC', expected_category: 'Housing/Rent' },
    { description: 'RENT PAYMENT TO LANDLORD VIA CREDIT', expected_category: 'Housing/Rent' },

    // Groceries
    { description: 'DMART GROCERY STORE MUM', expected_category: 'Groceries' },
    { description: 'BIGBASKET GROCERIES RECV', expected_category: 'Groceries' },
    { description: 'SWIGGY INSTAMART EXP DELV', expected_category: 'Groceries' },
    { description: 'ZEPTO GROCERIES IN 10 MINS', expected_category: 'Groceries' },
    { description: 'BLINKIT GROCERY DELIVERY DEL', expected_category: 'Groceries' },
    { description: 'RELIANCE SMART SUPERSTORE IN', expected_category: 'Groceries' },
    { description: 'SPENCERS RETAIL GROCERY MUM', expected_category: 'Groceries' },
    { description: 'LOCAL VEGETABLE AND FRUIT MART', expected_category: 'Groceries' },
    { description: 'NATURES BASKET GOURMET RETAIL', expected_category: 'Groceries' },
    { description: 'FOOD HALL GROCERIES SHOPPING', expected_category: 'Groceries' },

    // Food & Dining
    { description: 'SWIGGY FOOD ORDER ID-98217621', expected_category: 'Food & Dining' },
    { description: 'ZOMATO ONLINE FOOD ORDER', expected_category: 'Food & Dining' },
    { description: 'STARBUCKS COFFEE CONNAUGHT PL', expected_category: 'Food & Dining' },
    { description: 'BURGER KING MALL IND', expected_category: 'Food & Dining' },
    { description: 'DOMINOS PIZZA RETAIL OUTLET', expected_category: 'Food & Dining' },
    { description: 'CAFE COFFEE DAY AIRPORT DEL', expected_category: 'Food & Dining' },
    { description: 'SODA BOTTLE OPENER WALA RESTAURANT', expected_category: 'Food & Dining' },
    { description: 'MCDONALDS FAMILY RESTAURANT', expected_category: 'Food & Dining' },
    { description: 'THE LOCAL TAVERN DINING BAR', expected_category: 'Food & Dining' },
    { description: 'SWEET SHOP HALDIRAMS IND', expected_category: 'Food & Dining' },

    // Transport/Travel
    { description: 'UBER TRIP INDIA RAIL ROAD', expected_category: 'Transport/Travel' },
    { description: 'OLA CABS TRAVEL BANGALORE', expected_category: 'Transport/Travel' },
    { description: 'METRO RAIL TICKET VENDING CARD', expected_category: 'Transport/Travel' },
    { description: 'RAILWAY IRCTC TICKETS ONLINE', expected_category: 'Transport/Travel' },
    { description: 'INDIGO AIRLINES FLIGHT BOOKING', expected_category: 'Transport/Travel' },
    { description: 'MAKEMYTRIP HOTEL RESORT FLT', expected_category: 'Transport/Travel' },
    { description: 'SHELL PETROL PUMP REFUELING IN', expected_category: 'Transport/Travel' },
    { description: 'HP PETROLEUM IN VEHICLE', expected_category: 'Transport/Travel' },
    { description: 'RAPIDO BIKE TAXI RIDE BLR', expected_category: 'Transport/Travel' },
    { description: 'PARKING CHARGES METROPOLIS MALL', expected_category: 'Transport/Travel' },

    // Utilities
    { description: 'ELECTRICITY BOARD SEC-112 BILL', expected_category: 'Utilities' },
    { description: 'GAS RECHARGE GAIL PETROLEUM', expected_category: 'Utilities' },
    { description: 'INTERNET RECHARGE ACT FIBER', expected_category: 'Utilities' },
    { description: 'RECHARGE JIO PREPAID MOB RECH', expected_category: 'Utilities' },
    { description: 'AIRTEL POSTPAID BILL DEPOSIT', expected_category: 'Utilities' },
    { description: 'TATA PLAY SATELLITE TV CHARGE', expected_category: 'Utilities' },
    { description: 'MUNICIPAL WATER SUPPLY BILL', expected_category: 'Utilities' },
    { description: 'BROADBAND FIBER WIFI PAY CON', expected_category: 'Utilities' },
    { description: 'VI MOBILE TOPUP RECHARGE INST', expected_category: 'Utilities' },
    { description: 'PIPED NATURAL GAS PNG ADANI', expected_category: 'Utilities' },

    // Shopping
    { description: 'AMAZON IN Shopping Cart RETAIL', expected_category: 'Shopping' },
    { description: 'FLIPKART INTERNET COMMERCE', expected_category: 'Shopping' },
    { description: 'ZARA CLOTHINGS RETAIL STORE', expected_category: 'Shopping' },
    { description: 'H&M APPARELS OUTLET IN', expected_category: 'Shopping' },
    { description: 'MYNTRA FASHION WEAR ONLINE', expected_category: 'Shopping' },
    { description: 'DECATHLON SPORTS EQUIP MALL', expected_category: 'Shopping' },
    { description: 'AJIO ONLINE CLOTHING RETAIL', expected_category: 'Shopping' },
    { description: 'NYKAA COSMETICS AND BEAUTY', expected_category: 'Shopping' },
    { description: 'CROCS FOOTWEAR STORE IND', expected_category: 'Shopping' },
    { description: 'MINISO HOME AND GIFT STORES', expected_category: 'Shopping' },

    // Entertainment/Subscriptions
    { description: 'NETFLIX ENTERTAINMENT SUBSCRIPTION', expected_category: 'Entertainment/Subscriptions' },
    { description: 'SPOTIFY PREMIUM AUDIO SE', expected_category: 'Entertainment/Subscriptions' },
    { description: 'YOUTUBE PREMIUM SUBSCRIPTION', expected_category: 'Entertainment/Subscriptions' },
    { description: 'AMAZON PRIME ANNUAL GBR', expected_category: 'Entertainment/Subscriptions' },
    { description: 'HOTSTAR DISNEY PLUS PREMIUM', expected_category: 'Entertainment/Subscriptions' },
    { description: 'BOOKMYSHOW MOVIE TICKETS IMX', expected_category: 'Entertainment/Subscriptions' },
    { description: 'PLAYSTATION NETWORK PS PLUS', expected_category: 'Entertainment/Subscriptions' },
    { description: 'APPLE CLOUD SUBSCRIPTION ACC', expected_category: 'Entertainment/Subscriptions' },
    { description: 'XBOX GAME PASS MS VALUE SUBS', expected_category: 'Entertainment/Subscriptions' },
    { description: 'MEDIUM MEMBERSHIP READ CONTENT', expected_category: 'Entertainment/Subscriptions' },

    // Health/Pharmacy/Insurance
    { description: 'APOLLO PHARMACY DRUG STORE MUM', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'HDFC INSURANCE PREMIUM ANNUAL LIFE', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'PRACTO MEDICAL CONSULTATION FEE', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'MEDIBUDDY DIAGNOSTIC LAB LABS', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'MAX HEALTHCARE CLINIC HOSP', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'LIC LIFE INSURANCE SEMI-ANNUAL', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'CARE HEALTH ACCIDENT COVERAGE', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'PHARMEASY ONLINE MEDICINE DRG', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'DENTAL INVISALIGN CLINICAL CARE', expected_category: 'Health/Pharmacy/Insurance' },
    { description: 'FITNESS GYM MEMBERSHIP ACTIVE', expected_category: 'Health/Pharmacy/Insurance' },

    // Transfers/Payments/Other
    { description: 'TRANSFER TO FRIEND ACCT 317283712891', expected_category: 'Transfers/Payments/Other' },
    { description: 'CREDIT CARD OUTSTANDING TRANSFER REF', expected_category: 'Transfers/Payments/Other' },
    { description: 'IMPS BANK TRANSFER IMPS-9921', expected_category: 'Transfers/Payments/Other' },
    { description: 'NEFT DEPOSIT TO BROKER ANKIT', expected_category: 'Transfers/Payments/Other' },
    { description: 'UPI SENT TO MERCHANT MISC PET', expected_category: 'Transfers/Payments/Other' },
    { description: 'ATM CASH WITHDRAWAL CHARGE', expected_category: 'Transfers/Payments/Other' },
    { description: 'CREDIT CARD BILL PAYMENT ONLINE', expected_category: 'Transfers/Payments/Other' },
    { description: 'LOAN REPAYMENT MISCELLANEOUS', expected_category: 'Transfers/Payments/Other' },
    { description: 'MUTUAL FUND LUMPSUM COMM HDFC', expected_category: 'Transfers/Payments/Other' },
    { description: 'ZERO BALANCE ADJ FEES STAMPS', expected_category: 'Transfers/Payments/Other' }
  ];
}
