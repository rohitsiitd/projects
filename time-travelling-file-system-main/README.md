# Project: File Version Control System

This project is done by **2024CS10410**.

## Files:
1. `heap.hpp`
2. `Tree.hpp`
3. `build.ps1`
4. `map.hpp`
5. `test.cpp` (main file)
6. `README.txt`

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

### 1. `CREATE <filename>`
- Creates a file with a root version (ID 0), empty content, and an initial snapshot with the message "THIS IS ROOT".

### 2. `READ <filename>`
- Displays the content of the file’s currently active version.

### 3. `INSERT <filename> <content>`
- Appends content to the file. If the active version is already a snapshot, a new version is created. Otherwise, it modifies the active version in place.

### 4. `UPDATE <filename> <content>`
- Replaces the file’s content. This creates a new version with the given content if the current version is already a snapshot.

### 5. `SNAPSHOT <filename> <message>`
- Marks the active version as a snapshot, making its content immutable. Stores the provided message along with the current timestamp.

### 6. `ROLLBACK <filename> [versionID]`
- Sets the active version pointer to the specified version ID. If no ID is provided, it rolls back to the parent of the current active version.

### 7. `HISTORY <filename>`
- Lists all snapshotted versions of the file chronologically from active node to root. Displays their ID, timestamp, and message.

### 8. `RECENT_FILES <num>`
- Lists files in descending order of their last modification time. Restricts the listing to the first `num` entries.

### 9. `BIG_TREES <num>`
- Lists files in descending order of their total version count, restricted to the first `num` entries.

## Error Handling:
1. Any command other than the valid commands listed above will result in an "invalid input" error.
2. If the number given to `RECENT_FILES` or `BIG_TREES` exceeds the number of current files, the program will display information of all files.
3. If an empty filename is given with any function call, or if an invalid number is provided, the program will throw an "invalid input" verdict and wait for the next input.
4. Extra information in commands is ignored. For example:
   - `CREATE TEXT.txt hello` will ignore "hello" and execute the `CREATE TEXT.txt` command.
   - `HISTORY TEXT.txt hello` will ignore "hello" and execute the `HISTORY TEXT.txt` command.
   - `RECENT_FILES 12 hello` will ignore "hello" and execute the `RECENT_FILES 12` command.

## Important Information:
1. **Filename Constraints**:
   - The filename cannot be empty and must not contain spaces. If spaces are present, the program will take whatever is given before the first space as the filename.
   
2. **Content and Messages**:
   - Content and messages can contain spaces and can be empty.

3. **Precision for `RECENT_FILES`**:
   - `RECENT_FILES` works with second-level precision. This means files modified within the same second may have arbitrary ordering.

4. **Root File**:
   - The content of the root file is always empty and is always a snapshot.

5. **Modifying Files**:
   - Using `INSERT` or `UPDATE` on a file changes its modification time.

6. **File Duplication**:
   - Filenames cannot be duplicated. If you try to create a file with an existing filename, you will receive the verdict: `"FILE ALREADY EXISTS"`.

7. **Exiting the Program**:
   - To exit the program, type:  
     `exit` (in lowercase).

8. **Sequential Command Input**:
   - Enter lines of code sequentially. Ensure each command is on its own line.

9. **Comparators**:
   - The program uses comparators for heap sort (`nodect`, `modifiedtime`) to sort files based on the number of nodes or modification time respectively.

10. **Rollback from Root**:
    - Rolling back from the root will do nothing, and the current version will still be at the root. No error is thrown.

11. **Caution with `UPDATE` and `INSERT`**:
    - Commands like `UPDATE <FILE>` without any content will be treated as passing an empty string, resulting in empty content in the file. Be cautious when using `UPDATE` or `INSERT`.



