# Helper methods for the mogrifier script

def remove_empty_strings(string_list: list[str]) -> list[str]:
    '''Removes empty strings from a list
    '''
    return list(filter(None, string_list))