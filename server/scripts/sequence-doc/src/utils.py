# Helper methods for the mogrifier script

def reduce_to_boolean(boolList: list[bool]) -> bool:
    return any(boolList)

def common_member(l1, l2) -> bool:
    '''Is any member of l1 in l2
    '''
    return [i for i in l1 if i in l2]