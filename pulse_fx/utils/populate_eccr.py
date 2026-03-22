# This script is used to populate these tables in DB respectively:
# - exchange_rate_types
# - currencies (is referenced by Currency Encyclopedia: https://www.xe.com/currency/)
# - countries
# - rate-sources

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

CHECK_POPULATE = True

exchange_rate_types_data = {
    # "1": "Buy Cash",
    # "2": "Sell Cash",

    # "3": "Buy Transfer/IMT",
    # "4": "Sell Transfer/IMT",

    # "5": "Buy Cheque",
    # "6": "Sell Cheque",

    # "7": "Load currency to TMC",
    # "8": "Unload currency from TMC"
}

currency_data = {
    # # A
    # "AED": {"currency_name": "Emirati Dirham", "currency_symbol": "د.إ"},
    # "AFN": {"currency_name": "Afghan Afghani", "currency_symbol": "؋"},
    # "ALL": {"currency_name": "Albanian Lek", "currency_symbol": "L"},
    # "AMD": {"currency_name": "Armenian Dram", "currency_symbol": "֏"},
    # "ANG": {"currency_name": "Dutch Guilder", "currency_symbol": "ƒ"},
    # "AOA": {"currency_name": "Angolan Kwanza", "currency_symbol": "Kz"},
    # "ARS": {"currency_name": "Argentine Peso", "currency_symbol": "$"},
    # "AUD": {"currency_name": "Australian Dollar", "currency_symbol": "AU$"},
    # "AWG": {"currency_name": "Aruban or Dutch Guilder", "currency_symbol": "ƒ"},
    # "AZN": {"currency_name": "Azerbaijan Manat", "currency_symbol": "₼"},
    
    # # B
    # "BAM": {"currency_name": "Bosnia-Herzegovina Convertible Mark", "currency_symbol": "KM"},
    # "BBD": {"currency_name": "Barbadian or Bajan Dollar", "currency_symbol": "BBD$"},
    # "BCH": {"currency_name": "Bitcoin Cash", "currency_symbol": "BCH"},
    # "BDT": {"currency_name": "Bangladeshi Taka", "currency_symbol": "৳"},
    # "BHD": {"currency_name": "Bahraini Dinar", "currency_symbol": "د.ب"},
    # "BIF": {"currency_name": "Burundian Franc", "currency_symbol": "FBu"},
    # "BMD": {"currency_name": "Bermudian Dollar", "currency_symbol": "BD$"},
    # "BND": {"currency_name": "Bruneian Dollar", "currency_symbol": "B$"},
    # "BOB": {"currency_name": "Bolivian Bolíviano", "currency_symbol": "Bs"},
    # "BRL": {"currency_name": "Brazilian Real", "currency_symbol": "R$"},
    # "BSD": {"currency_name": "Bahamian Dollar", "currency_symbol": "B$"},
    # "BTN": {"currency_name": "Bhutanese Ngultrum", "currency_symbol": "Nu."},
    # "BWP": {"currency_name": "Botswana Pula", "currency_symbol": "P"},
    # "BYN": {"currency_name": "Belarusian Ruble", "currency_symbol": "Br"},
    # "BZD": {"currency_name": "Belizean Dollar", "currency_symbol": "BZ$"},

    # # C
    # "CAD": {"currency_name": "Canadian Dollar", "currency_symbol": "CA$"},
    # "CDF": {"currency_name": "Congolese Franc", "currency_symbol": "FC"},
    # "CHF": {"currency_name": "Swiss Franc", "currency_symbol": "CHF"},
    # "CLP": {"currency_name": "Chilean Peso", "currency_symbol": "$"},
    # "CNY": {"currency_name": "Chinese Yuan Renminbi", "currency_symbol": "¥"},
    # "COP": {"currency_name": "Colombian Peso", "currency_symbol": "Col$"},
    # "CRC": {"currency_name": "Costa Rican Colon", "currency_symbol": "₡"},
    # "CUC": {"currency_name": "Cuban Convertible Peso", "currency_symbol": "CUC$"},
    # "CUP": {"currency_name": "Cuban Peso", "currency_symbol": "₱"},
    # "CVE": {"currency_name": "Cape Verdean Escudo", "currency_symbol": "$"},
    # "CZK": {"currency_name": "Czech Koruna", "currency_symbol": "Kč"},

    # # D
    # "DJF": {"currency_name": "Djiboutian Franc", "currency_symbol": "Fdj"},
    # "DKK": {"currency_name": "Danish Krone", "currency_symbol": "kr."},
    # "DOP": {"currency_name": "Dominican Peso", "currency_symbol": "RD$"},
    # "DZD": {"currency_name": "Algerian Dinar", "currency_symbol": "د.ج"},

    # # E
    # "EGP": {"currency_name": "Egyptian Pound", "currency_symbol": "£"},
    # "ERN": {"currency_name": "Eritrean Nakfa", "currency_symbol": "Nfk"},
    # "ETB": {"currency_name": "Ethiopian Birr", "currency_symbol": "Br"},
    # "ETH": {"currency_name": "Ethereum", "currency_symbol": "ETH"},
    # "EUR": {"currency_name": "Euro", "currency_symbol": "€"},

    # # F
    # "FJD": {"currency_name": "Fijian Dollar", "currency_symbol": "FJ$"},
    # "FKP": {"currency_name": "Falkland Islands Pound", "currency_symbol": "£"},
    
    # # G
    # "GBP": {"currency_name": "British Pound", "currency_symbol": "£"},
    # "GEL": {"currency_name": "Georgian Lari", "currency_symbol": "₾"},
    # "GGP": {"currency_name": "Guernsey Pound", "currency_symbol": "£"},
    # "GHS": {"currency_name": "Ghanaian Cedi", "currency_symbol": "GH₵"},
    # "GIP": {"currency_name": "Gibraltar Pound", "currency_symbol": "£"},
    # "GMD": {"currency_name": "Gambian Dalasi", "currency_symbol": "D"},
    # "GNF": {"currency_name": "Guinean Franc", "currency_symbol": "GFr"},
    # "GTQ": {"currency_name": "Guatemalan Quetzal", "currency_symbol": "Q"},
    # "GYD": {"currency_name": "Guyanese Dollar", "currency_symbol": "GY$"},

    # # H
    # "HKD": {"currency_name": "Hong Kong Dollar", "currency_symbol": "HK$"},
    # "HNL": {"currency_name": "Honduran Lempira", "currency_symbol": "L"},
    # "HTG": {"currency_name": "Haitian Gourde", "currency_symbol": "G"},
    # "HUF": {"currency_name": "Hungarian Forint", "currency_symbol": "Ft"},

    # # I
    # "IDR": {"currency_name": "Indonesian Rupiah", "currency_symbol": "Rp"},
    # "ILS": {"currency_name": "Israeli New Shekel", "currency_symbol": "₪"},
    # "IMP": {"currency_name": "Manx Pound", "currency_symbol": "£"},
    # "INR": {"currency_name": "Indian Rupee", "currency_symbol": "₹"},
    # "IQD": {"currency_name": "Iraqi Dinar", "currency_symbol": "د.ع"},
    # "IRR": {"currency_name": "Iranian Rial", "currency_symbol": "﷼"},
    # "ISK": {"currency_name": "Icelandic Króna", "currency_symbol": "kr"},
    
    # # J
    # "JEP": {"currency_name": "Jersey Pound", "currency_symbol": "£"},
    # "JMD": {"currency_name": "Jamaican Dollar", "currency_symbol": "J$"},
    # "JOD": {"currency_name": "Jordanian Dinar", "currency_symbol": "د.ا"},
    # "JPY": {"currency_name": "Japanese Yen", "currency_symbol": "¥"},

    # # K
    # "KES": {"currency_name": "Kenyan Shilling", "currency_symbol": "KSh"},
    # "KGS": {"currency_name": "Kyrgyzstani Som", "currency_symbol": "лв"},
    # "KHR": {"currency_name": "Cambodian Riel", "currency_symbol": "៛"},
    # "KMF": {"currency_name": "Comorian Franc", "currency_symbol": "CF"},
    # "KPW": {"currency_name": "North Korean Won", "currency_symbol": "₩"},
    # "KRW": {"currency_name": "South Korean Won", "currency_symbol": "₩"},
    # "KWD": {"currency_name": "Kuwaiti Dinar", "currency_symbol": "ك"},
    # "KYD": {"currency_name": "Cayman Islands Dollar", "currency_symbol": "$"},
    # "KZT": {"currency_name": "Kazakhstani Tenge", "currency_symbol": "₸"},

    # # L
    # "LAK": {"currency_name": "Lao Kip", "currency_symbol": "₭"},
    # "LBP": {"currency_name": "Lebanese Pound", "currency_symbol": "ل.ل"},
    # "LKR": {"currency_name": "Sri Lankan Rupee", "currency_symbol": "රු"},
    # "LRD": {"currency_name": "Liberian Dollar", "currency_symbol": "L$"},
    # "LSL": {"currency_name": "Lesotho Loti", "currency_symbol": "L"},
    # "LTL": {"currency_name": "Lithuanian Litas", "currency_symbol": "Lt"},
    # "LVL": {"currency_name": "Latvian Lats", "currency_symbol": "Ls"},
    # "LYD": {"currency_name": "Libyan Dinar", "currency_symbol": "د.ل"},

    # # M
    # "MAD": {"currency_name": "Moroccan Dirham", "currency_symbol": "د.م."},
    # "MDL": {"currency_name": "Moldovan Leu", "currency_symbol": "L"},
    # "MGA": {"currency_name": "Malagasy Ariary", "currency_symbol": "Ar"},
    # "MKD": {"currency_name": "Macedonian Denar", "currency_symbol": "ден"},
    # "MMK": {"currency_name": "Burmese Kyat", "currency_symbol": "K"},
    # "MNT": {"currency_name": "Mongolian Tögrög", "currency_symbol": "₮"},
    # "MOP": {"currency_name": "Macanese Pataca", "currency_symbol": "P"},
    # "MRU": {"currency_name": "Mauritanian Ouguiya", "currency_symbol": "UM"},
    # "MUR": {"currency_name": "Mauritian Rupee", "currency_symbol": "₨"},
    # "MVR": {"currency_name": "Maldivian Rufiyaa", "currency_symbol": "Rf"},
    # "MWK": {"currency_name": "Malawian Kwacha", "currency_symbol": "MK"},
    # "MXN": {"currency_name": "Mexican Peso", "currency_symbol": "$"},
    # "MYR": {"currency_name": "Malaysian Ringgit", "currency_symbol": "RM"},
    # "MZN": {"currency_name": "Mozambican Metical", "currency_symbol": "MT"},

    # # N
    # "NAD": {"currency_name": "Namibian Dollar", "currency_symbol": "N$"},
    # "NGN": {"currency_name": "Nigerian Naira", "currency_symbol": "₦"},
    # "NIO": {"currency_name": "Nicaraguan Córdoba", "currency_symbol": "C$"},
    # "NOK": {"currency_name": "Norwegian Krone", "currency_symbol": "kr"},
    # "NPR": {"currency_name": "Nepalese Rupee", "currency_symbol": "₨"},
    # "NZD": {"currency_name": "New Zealand Dollar", "currency_symbol": "NZ$"},

    # # O
    # "OMR": {"currency_name": "Omani Rial", "currency_symbol": "ر.ع."},

    # # P
    # "PAB": {"currency_name": "Panamanian Balboa", "currency_symbol": "B/."},
    # "PEN": {"currency_name": "Peruvian Sol", "currency_symbol": "S/"},
    # "PGK": {"currency_name": "Papua New Guinean Kina", "currency_symbol": "K"},
    # "PHP": {"currency_name": "Philippine Peso", "currency_symbol": "₱"},
    # "PKR": {"currency_name": "Pakistani Rupee", "currency_symbol": "₨"},
    # "PLN": {"currency_name": "Polish Złoty", "currency_symbol": "zł"},
    # "PYG": {"currency_name": "Paraguayan Guaraní", "currency_symbol": "₲"},

    # # Q
    # "QAR": {"currency_name": "Qatari Rial", "currency_symbol": "ر.ق"},

    # # R
    # "RON": {"currency_name": "Romanian Leu", "currency_symbol": "lei"},
    # "RSD": {"currency_name": "Serbian Dinar", "currency_symbol": "дин."},
    # "RUB": {"currency_name": "Russian Ruble", "currency_symbol": "₽"},
    # "RWF": {"currency_name": "Rwandan Franc", "currency_symbol": "FRw"},

    # # S
    # "SAR": {"currency_name": "Saudi Riyal", "currency_symbol": "ر.س"},
    # "SBD": {"currency_name": "Solomon Islands Dollar", "currency_symbol": "SI$"},
    # "SCR": {"currency_name": "Seychellois Rupee", "currency_symbol": "₨"},
    # "SDG": {"currency_name": "Sudanese Pound", "currency_symbol": "ج.س."},
    # "SEK": {"currency_name": "Swedish Krona", "currency_symbol": "kr"},
    # "SGD": {"currency_name": "Singapore Dollar", "currency_symbol": "S$"},
    # "SHP": {"currency_name": "Saint Helena Pound", "currency_symbol": "£"},
    # "SOS": {"currency_name": "Somali Shilling", "currency_symbol": "Sh.So."},
    # "SRD": {"currency_name": "Surinamese Dollar", "currency_symbol": "SRD"},
    # "STN": {"currency_name": "São Tomé and Príncipe Dobra", "currency_symbol": "Db"},
    # "SVC": {"currency_name": "Salvadoran Colón", "currency_symbol": "₡"},
    # "SYP": {"currency_name": "Syrian Pound", "currency_symbol": "ل.س."},
    # "SZL": {"currency_name": "Swazi Lilangeni", "currency_symbol": "L"},

    # # T
    # "THB": {"currency_name": "Thai Baht", "currency_symbol": "฿"},
    # "TJS": {"currency_name": "Tajikistani Somoni", "currency_symbol": "ЅМ"},
    # "TMT": {"currency_name": "Turkmenistan Manat", "currency_symbol": "m"},
    # "TND": {"currency_name": "Tunisian Dinar", "currency_symbol": "د.ت"},
    # "TOP": {"currency_name": "Tongan Paʻanga", "currency_symbol": "T$"},
    # "TRY": {"currency_name": "Turkish Lira", "currency_symbol": "₺"},
    # "TTD": {"currency_name": "Trinidad and Tobago Dollar", "currency_symbol": "TT$"},
    # "TWD": {"currency_name": "New Taiwan Dollar", "currency_symbol": "NT$"},
    # "TZS": {"currency_name": "Tanzanian Shilling", "currency_symbol": "TSh"},

    # # U
    # "UAH": {"currency_name": "Ukrainian Hryvnia", "currency_symbol": "₴"},
    # "UGX": {"currency_name": "Ugandan Shilling", "currency_symbol": "USh"},
    # "USD": {"currency_name": "United States Dollar", "currency_symbol": "$"},
    # "UYU": {"currency_name": "Uruguayan Peso", "currency_symbol": "$U"},
    # "UZS": {"currency_name": "Uzbekistani Soʻm", "currency_symbol": "soʻm"},

    # # V
    # "VUV": {"currency_name": "Vanuatu Vatu", "currency_symbol": "Vt"},
    # "VND": {"currency_name": "Vietnamese Đồng", "currency_symbol": "₫"},

    # # W
    # "WST": {"currency_name": "Samoan Tālā", "currency_symbol": "T"},

    # # X
    # "XAF": {"currency_name": "Central African CFA Franc", "currency_symbol": "Fr"},
    # "XCD": {"currency_name": "East Caribbean Dollar", "currency_symbol": "$"},
    # "XOF": {"currency_name": "West African CFA Franc", "currency_symbol": "Fr"},
    # "XPF": {"currency_name": "CFP Franc", "currency_symbol": "Fr"},

    # # Y
    # "YER": {"currency_name": "Yemeni Rial", "currency_symbol": "ر.ي"},

    # # Z
    # "ZAR": {"currency_name": "South African Rand", "currency_symbol": "R"},
    # "ZMW": {"currency_name": "Zambian Kwacha", "currency_symbol": "ZK"},
    # "ZWL": {"currency_name": "Zimbabwean Dollar", "currency_symbol": "$"},
}

country_data = {
    # "AE": {"country_name": "United Arab Emirates", "currency_code": "AED"},
    # "AF": {"country_name": "Afghanistan", "currency_code": "AFN"},
    # "AL": {"country_name": "Albania", "currency_code": "ALL"},
    # "AM": {"country_name": "Armenia", "currency_code": "AMD"},
    # "AO": {"country_name": "Angola", "currency_code": "AOA"},
    # "AR": {"country_name": "Argentina", "currency_code": "ARS"},
    # "AU": {"country_name": "Australia", "currency_code": "AUD"},
    # "AZ": {"country_name": "Azerbaijan", "currency_code": "AZN"},

    # "BA": {"country_name": "Bosnia and Herzegovina", "currency_code": "BAM"},
    # "BB": {"country_name": "Barbados", "currency_code": "BBD"},
    # "BD": {"country_name": "Bangladesh", "currency_code": "BDT"},
    # "BH": {"country_name": "Bahrain", "currency_code": "BHD"},
    # "BI": {"country_name": "Burundi", "currency_code": "BIF"},
    # "BM": {"country_name": "Bermuda", "currency_code": "BMD"},
    # "BN": {"country_name": "Brunei", "currency_code": "BND"},
    # "BO": {"country_name": "Bolivia", "currency_code": "BOB"},
    # "BR": {"country_name": "Brazil", "currency_code": "BRL"},
    # "BS": {"country_name": "Bahamas", "currency_code": "BSD"},
    # "BT": {"country_name": "Bhutan", "currency_code": "BTN"},
    # "BW": {"country_name": "Botswana", "currency_code": "BWP"},
    # "BY": {"country_name": "Belarus", "currency_code": "BYN"},
    # "BZ": {"country_name": "Belize", "currency_code": "BZD"},

    # "CA": {"country_name": "Canada", "currency_code": "CAD"},
    # "CD": {"country_name": "Democratic Republic of the Congo", "currency_code": "CDF"},
    # "CH": {"country_name": "Switzerland", "currency_code": "CHF"},
    # "CL": {"country_name": "Chile", "currency_code": "CLP"},
    # "CN": {"country_name": "China", "currency_code": "CNY"},
    # "CO": {"country_name": "Colombia", "currency_code": "COP"},
    # "CR": {"country_name": "Costa Rica", "currency_code": "CRC"},
    # "CU": {"country_name": "Cuba", "currency_code": "CUP"},
    # "CV": {"country_name": "Cape Verde", "currency_code": "CVE"},
    # "CZ": {"country_name": "Czech Republic", "currency_code": "CZK"},

    # "DJ": {"country_name": "Djibouti", "currency_code": "DJF"},
    # "DK": {"country_name": "Denmark", "currency_code": "DKK"},
    # "DO": {"country_name": "Dominican Republic", "currency_code": "DOP"},
    # "DZ": {"country_name": "Algeria", "currency_code": "DZD"},

    # "EG": {"country_name": "Egypt", "currency_code": "EGP"},
    # "ER": {"country_name": "Eritrea", "currency_code": "ERN"},
    # "ET": {"country_name": "Ethiopia", "currency_code": "ETB"},
    # "EU": {"country_name": "Eurozone", "currency_code": "EUR"},

    # "FJ": {"country_name": "Fiji", "currency_code": "FJD"},
    # "FK": {"country_name": "Falkland Islands", "currency_code": "FKP"},

    # "GB": {"country_name": "United Kingdom", "currency_code": "GBP"},
    # "GE": {"country_name": "Georgia", "currency_code": "GEL"},
    # "GH": {"country_name": "Ghana", "currency_code": "GHS"},
    # "GI": {"country_name": "Gibraltar", "currency_code": "GIP"},
    # "GM": {"country_name": "Gambia", "currency_code": "GMD"},
    # "GN": {"country_name": "Guinea", "currency_code": "GNF"},
    # "GT": {"country_name": "Guatemala", "currency_code": "GTQ"},
    # "GY": {"country_name": "Guyana", "currency_code": "GYD"},

    # "HK": {"country_name": "Hong Kong", "currency_code": "HKD"},
    # "HN": {"country_name": "Honduras", "currency_code": "HNL"},
    # "HT": {"country_name": "Haiti", "currency_code": "HTG"},
    # "HU": {"country_name": "Hungary", "currency_code": "HUF"},

    # "ID": {"country_name": "Indonesia", "currency_code": "IDR"},
    # "IL": {"country_name": "Israel", "currency_code": "ILS"},
    # "IN": {"country_name": "India", "currency_code": "INR"},
    # "IQ": {"country_name": "Iraq", "currency_code": "IQD"},
    # "IR": {"country_name": "Iran", "currency_code": "IRR"},
    # "IS": {"country_name": "Iceland", "currency_code": "ISK"},

    # "JM": {"country_name": "Jamaica", "currency_code": "JMD"},
    # "JO": {"country_name": "Jordan", "currency_code": "JOD"},
    # "JP": {"country_name": "Japan", "currency_code": "JPY"},

    # "KE": {"country_name": "Kenya", "currency_code": "KES"},
    # "KG": {"country_name": "Kyrgyzstan", "currency_code": "KGS"},
    # "KH": {"country_name": "Cambodia", "currency_code": "KHR"},
    # "KM": {"country_name": "Comoros", "currency_code": "KMF"},
    # "KP": {"country_name": "North Korea", "currency_code": "KPW"},
    # "KR": {"country_name": "South Korea", "currency_code": "KRW"},
    # "KW": {"country_name": "Kuwait", "currency_code": "KWD"},
    # "KY": {"country_name": "Cayman Islands", "currency_code": "KYD"},
    # "KZ": {"country_name": "Kazakhstan", "currency_code": "KZT"},

    # "LA": {"country_name": "Laos", "currency_code": "LAK"},
    # "LB": {"country_name": "Lebanon", "currency_code": "LBP"},
    # "LK": {"country_name": "Sri Lanka", "currency_code": "LKR"},
    # "LR": {"country_name": "Liberia", "currency_code": "LRD"},
    # "LS": {"country_name": "Lesotho", "currency_code": "LSL"},
    # "LY": {"country_name": "Libya", "currency_code": "LYD"},

    # "MA": {"country_name": "Morocco", "currency_code": "MAD"},
    # "MD": {"country_name": "Moldova", "currency_code": "MDL"},
    # "MG": {"country_name": "Madagascar", "currency_code": "MGA"},
    # "MK": {"country_name": "North Macedonia", "currency_code": "MKD"},
    # "MM": {"country_name": "Myanmar", "currency_code": "MMK"},
    # "MN": {"country_name": "Mongolia", "currency_code": "MNT"},
    # "MO": {"country_name": "Macau", "currency_code": "MOP"},
    # "MR": {"country_name": "Mauritania", "currency_code": "MRU"},
    # "MU": {"country_name": "Mauritius", "currency_code": "MUR"},
    # "MV": {"country_name": "Maldives", "currency_code": "MVR"},
    # "MW": {"country_name": "Malawi", "currency_code": "MWK"},
    # "MX": {"country_name": "Mexico", "currency_code": "MXN"},
    # "MY": {"country_name": "Malaysia", "currency_code": "MYR"},
    # "MZ": {"country_name": "Mozambique", "currency_code": "MZN"},

    # "NA": {"country_name": "Namibia", "currency_code": "NAD"},
    # "NG": {"country_name": "Nigeria", "currency_code": "NGN"},
    # "NI": {"country_name": "Nicaragua", "currency_code": "NIO"},
    # "NO": {"country_name": "Norway", "currency_code": "NOK"},
    # "NP": {"country_name": "Nepal", "currency_code": "NPR"},
    # "NZ": {"country_name": "New Zealand", "currency_code": "NZD"},

    # "OM": {"country_name": "Oman", "currency_code": "OMR"},

    # "PA": {"country_name": "Panama", "currency_code": "PAB"},
    # "PE": {"country_name": "Peru", "currency_code": "PEN"},
    # "PG": {"country_name": "Papua New Guinea", "currency_code": "PGK"},
    # "PH": {"country_name": "Philippines", "currency_code": "PHP"},
    # "PK": {"country_name": "Pakistan", "currency_code": "PKR"},
    # "PL": {"country_name": "Poland", "currency_code": "PLN"},
    # "PY": {"country_name": "Paraguay", "currency_code": "PYG"},

    # "QA": {"country_name": "Qatar", "currency_code": "QAR"},

    # "RO": {"country_name": "Romania", "currency_code": "RON"},
    # "RS": {"country_name": "Serbia", "currency_code": "RSD"},
    # "RU": {"country_name": "Russia", "currency_code": "RUB"},
    # "RW": {"country_name": "Rwanda", "currency_code": "RWF"},

    # "SA": {"country_name": "Saudi Arabia", "currency_code": "SAR"},
    # "SB": {"country_name": "Solomon Islands", "currency_code": "SBD"},
    # "SC": {"country_name": "Seychelles", "currency_code": "SCR"},
    # "SD": {"country_name": "Sudan", "currency_code": "SDG"},
    # "SE": {"country_name": "Sweden", "currency_code": "SEK"},
    # "SG": {"country_name": "Singapore", "currency_code": "SGD"},
    # "SH": {"country_name": "Saint Helena", "currency_code": "SHP"},
    # "SO": {"country_name": "Somalia", "currency_code": "SOS"},
    # "SR": {"country_name": "Suriname", "currency_code": "SRD"},
    # "ST": {"country_name": "Sao Tome and Principe", "currency_code": "STN"},
    # "SV": {"country_name": "El Salvador", "currency_code": "SVC"},
    # "SY": {"country_name": "Syria", "currency_code": "SYP"},
    # "SZ": {"country_name": "Eswatini", "currency_code": "SZL"},

    # "TH": {"country_name": "Thailand", "currency_code": "THB"},
    # "TJ": {"country_name": "Tajikistan", "currency_code": "TJS"},
    # "TM": {"country_name": "Turkmenistan", "currency_code": "TMT"},
    # "TN": {"country_name": "Tunisia", "currency_code": "TND"},
    # "TO": {"country_name": "Tonga", "currency_code": "TOP"},
    # "TR": {"country_name": "Turkey", "currency_code": "TRY"},
    # "TT": {"country_name": "Trinidad and Tobago", "currency_code": "TTD"},
    # "TW": {"country_name": "Taiwan", "currency_code": "TWD"},
    # "TZ": {"country_name": "Tanzania", "currency_code": "TZS"},

    # "UA": {"country_name": "Ukraine", "currency_code": "UAH"},
    # "UG": {"country_name": "Uganda", "currency_code": "UGX"},
    # "US": {"country_name": "United States", "currency_code": "USD"},
    # "UY": {"country_name": "Uruguay", "currency_code": "UYU"},
    # "UZ": {"country_name": "Uzbekistan", "currency_code": "UZS"},

    # "VN": {"country_name": "Vietnam", "currency_code": "VND"},
    # "VU": {"country_name": "Vanuatu", "currency_code": "VUV"},

    # "WS": {"country_name": "Samoa", "currency_code": "WST"},

    # "ZA": {"country_name": "South Africa", "currency_code": "ZAR"},
    # "ZM": {"country_name": "Zambia", "currency_code": "ZMW"},
    # "ZW": {"country_name": "Zimbabwe", "currency_code": "ZWL"},
}

rate_source_data = {
    # "VCB": {"source_name": "Joint Stock Commercial Bank for Foreign Trade of Vietnam", "source_link": "https://www.vietcombank.com.vn/", "source_country": "VietNam"},
    # "BIDV": {"source_name": "Joint Stock Commercial Bank for Investment and Development of Vietnam", "source_link": "https://www.bidv.com.vn/", "source_country": "VietNam"},
    # "VTB": {"source_name": "Vietnam Joint Stock Commercial Bank for Industry and Trade", "source_link": "https://www.vietinbank.vn/", "source_country": "VietNam"},
    # "ACB": {"source_name": "Asia Commercial Joint Stock Bank", "source_link": "https://www.acb.com.vn/", "source_country": "VietNam"},
    # "MBB": {"source_name": "Military Commercial Joint Stock Bank", "source_link": "https://www.mbbank.com.vn/", "source_country": "VietNam"},
    # "CBA": {"source_name": "Commonwealth Bank of Australia", "source_link": "https://www.commbank.com.au/", "source_country": "Australia"},
    # "WBC": {"source_name": "Westpac Banking Corporation", "source_link": "https://www.westpac.com.au/", "source_country": "Australia"},
    # "NAB": {"source_name": "National Australia Bank", "source_link": "https://www.nab.com.au/", "source_country": "Australia"},
    # "ANZ": {"source_name": "Australia and New Zealand Banking Group", "source_link": "https://www.anz.com.au/", "source_country": "Australia"},
    # "WISE": {"source_name": "Wise PLC", "source_link": "https://wise.com/", "source_country": "UnitedKingdom"},
    # "REVOLUT": {"source_name": "Revolut Group Holdings Ltd.", "source_link": "https://www.revolut.com/", "source_country": "UnitedKingdom"},
    # "PYPL": {"source_name": "PayPal Holdings, Inc.", "source_link": "https://www.paypal.com/", "source_country": "UnitedStates"},
    # "STRIPE": {"source_name": "Stripe, Inc.", "source_link": "https://stripe.com/", "source_country": "UnitedStates"},
    # "JPM": {"source_name": "JPMorgan Chase & Co.", "source_link": "https://www.jpmorgan.com/", "source_country": "UnitedStates"},
    # "BAC": {"source_name": "Bank of America Corporation", "source_link": "https://www.bankofamerica.com/", "source_country": "UnitedStates"},
}

# Connect to Supabase with .env file
def connect_supabase():
    load_dotenv()

    DATABASE_URI = os.environ.get("SUPABASE_URI")
    
    return create_engine(DATABASE_URI)

# populate exchange_rate_types table
def populate_exchange_rate_types(connection):
    if len(exchange_rate_types_data) == 0:
        print("No exchange rate types to populate")
        return
    
    for key, value in exchange_rate_types_data.items():
        connection.execute(text(f"\
            INSERT INTO exchange_rate_types (type_name) \
            SELECT '{value}' \
            WHERE NOT EXISTS (SELECT 1 FROM exchange_rate_types WHERE type_name = '{value}')"\
        ))
    connection.commit()
    print("Populated exchange_rate_types table")

# populate currencies table
def populate_currencies(connection):
    if len(currency_data) == 0:
        print("No currencies to populate")
        return
    
    for key, value in currency_data.items():
        connection.execute(text(f"\
            INSERT INTO currencies (currency_code, currency_name, currency_symbol) \
            SELECT '{key}', '{value['currency_name']}', '{value['currency_symbol']}' \
            WHERE NOT EXISTS (SELECT 1 FROM currencies WHERE currency_code = '{key}')"\
        ))
    connection.commit()
    print("Populated currencies table")

# populate countries table
def populate_countries(connection):
    if len(country_data) == 0:
        print("No countries to populate")
        return
    
    for key, value in country_data.items():
        connection.execute(text(f"\
            INSERT INTO countries (country_code, country_name, currency_id) \
            SELECT '{key}', '{value['country_name']}', \
                (SELECT currency_id FROM currencies WHERE currency_code = '{value['currency_code']}') \
            WHERE NOT EXISTS (SELECT 1 FROM countries WHERE country_code = '{key}')"\
        ))
    connection.commit()
    print("Populated countries table")

# populate rate-sources table
def populate_rate_sources(connection):
    if len(rate_source_data) == 0:
        print("No rate sources to populate")
        return
    
    for key, value in rate_source_data.items():
        connection.execute(text(f"\
            INSERT INTO rate_sources (source_code, source_name, source_link, source_country) \
            SELECT '{key}', '{value['source_name']}', '{value['source_link']}', '{value['source_country']}' \
            WHERE NOT EXISTS (SELECT 1 FROM rate_sources WHERE source_code = '{key}')"\
        ))
    connection.commit()
    print("Populated rate_sources table")

if __name__ == "__main__":
    if CHECK_POPULATE:
        print("Already populated")
        exit(0)
    
    print("Populating currencies, countries, and rate-sources tables...")
    connection = connect_supabase().connect()
    populate_exchange_rate_types(connection)
    populate_currencies(connection)
    populate_countries(connection)
    populate_rate_sources(connection)
    connection.close()
    print("Populated currencies, countries, and rate-sources tables")