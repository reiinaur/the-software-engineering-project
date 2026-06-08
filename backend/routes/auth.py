import re
import uuid
import bcrypt

name = input("Name: ")
userName = input("Username: ")
userEmail = input("Email: ")
passInput = input("Password: ")
confirmPass = input("Confirm password: ")

def signUp(name, userName, userEmail, passInput, confirmPass):
    def emailValid(userEmail):
        email_validate_pattern = r"^\S+@\S+\.\S+$"
        validation = re.match(email_validate_pattern, userEmail)
        if validation == None:
            return False
        else:
            return True
        
    while emailValid(userEmail) == False:
        print("Invalid email format.")
        userEmail = input("Email: ")
        emailValid(userEmail)

    while passInput != confirmPass:
        print("Passwords do not match.")
        passInput = input("Password: ")
        confirmPass = input("Confirm password: ")

    userId = uuid.uuid4()
    bytes = passInput.encode('utf-8')
    salt = bcrypt.gensalt()
    userPass = bcrypt.hashpw(bytes,salt)

    print(userId, name, userName, userEmail, userPass)

signUp(name, userName, userEmail, passInput, confirmPass)
