# A quick helper function to clean numbers like "26,069.00" -> 26069.00
def parse_rate(rate_str: str):
    rate_str = rate_str.strip()
    if not rate_str or rate_str == '-' or rate_str == '0':
        return None
    return float(rate_str.replace(',', ''))

def clean_symbol(symbol: str):
    return symbol.replace('#', '').replace('&', '').strip()