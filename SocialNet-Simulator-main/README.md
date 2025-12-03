# Project: SocialNet Simulator

This project is done by **2024CS10410**.

## Files:
1. `graph.hpp`
2. `AVL.hpp`
3. `build.ps1`
4. `test.cpp` (main file)
5. `README.md`

## How to Run:
1. Open the terminal/powershell in your operating system.
2. Change the directory to where the files are located using the command:  
   `cd <directory location of the folder with files extracted>`  
   For example:  
   `cd C:\Users\Hp\Documents\assignment`
3. Bypass the execution policy using the command:  
   `Set-ExecutionPolicy -Scope Process Bypass`
4. Run the script by typing:  
   `.\build.ps1`

## Syntax for Valid Commands:

### 1. `ADD_USER <username>`
- Adds a new user to the network, initially with no friends and no posts.

### 2. `ADD_FRIEND <username1> <username2>`
-  Establishes a bidirectional friendship between two existing
 usernames.

### 3. `SUGGEST_FRIENDS <username> <N>`
-  Recommends up to N new friends who are ”friends of a friend”
 but not already friends, Ranked by number of mutual friends.

### 4. ` DEGREES_OF_SEPARATION <username1> <username2>`
- Calculates the length of the shortest path of
 friendships between two usernames. If no path exists, reports-1.

### 5. ` ADD_POST <username> "<post content>"`
- Add a post whose content is the post_content string, to the posts created by the specified user

### 6. ` OUTPUT_POSTS <username> <N>`
-  Output the most recent N posts of the user, in reverse chronological
 order. If N is-1, you should output all the posts by the user. If there are fewer than N posts by the user,
 then list all available posts.


## Error Handling:
1. Any command other than the valid commands listed above will result in an "invalid input" error.
2. program will throw an error on creating multiple instances of same user.
3. If an empty filename is given with any function call, or if an invalid number is provided, the program will throw an "invalid input" verdict and wait for the next input.
4. Extra information in commands is ignored. 
5. program outputs nothing on making two persons friend who are already friends.
6. Any operation associated with a non existing user will result in an error.
7. degree of sepration will output -1 if there is no friendship path between two users, or either of them is not existing.

## Important Information:
1. **username Constraints**:
   - The username cannot be empty and must not contain spaces. If spaces are present, the program will take whatever is given before the first space as the username.
   - usernames are case insensitive.
   
2. **Post contents**:
   - Post Content can contain spaces and can be empty as well and are case sensitive .

3. **Exiting the Program**:
   - To exit the program, type:  
     `exit` (in lowercase).







