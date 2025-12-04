// Package util provides utility functions for the application
package util

// currently, there are 5 fixed currencies in the database
// TODO: implement a crawler or using an API to get the latest currencies
var currencyCodes = []string{
	"USD", "EUR", "VND", "AUD", "JPY",
}

var currencyNames = []string{
	"United States Dollar", "Euro", "Vietnamese Dong", "Australian Dollar", "Japanese Yen",
}

var currencyCountries = []string{
	"United States", "Eurozone", "Vietnam", "Australia", "Japan",
}

var currencySymbols = []string{
	"$", "€", "₫", "$", "¥",
}

func GetLengthListCurrencies() int {
	return len(currencyCodes)
}

// GetAllCurrencies returns a list of currencies as maps (Python dict-like)
func GetAllCurrencies() []map[string]interface{} {
	var currencies []map[string]interface{}
	var n = len(currencyCodes)

	for i := 0; i < n; i++ {
		currency := map[string]interface{}{
			"currency_code":    currencyCodes[i],
			"currency_name":    currencyNames[i],
			"currency_country": currencyCountries[i],
			"currency_symbol":  currencySymbols[i],
		}
		currencies = append(currencies, currency)
	}

	return currencies
}
