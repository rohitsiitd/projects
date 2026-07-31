BUILD INSTRUCTIONS:-


0. (optional) for installing Qt6 libraries g++ make cmake
    sudo apt update
    sudo apt install build-essential cmake qt6-base-dev qt6-tools-dev qt6-tools-dev-tools libxkbcommon-dev



1. Change directory to the  vector-editor folder.
    example- cd mnt/ssd_D/vector-editor  

    or

    locate the directory and right click->open in terminal

2. run "rm -rf build"               //clears old build
        "mkdir build"
        "cd build"
        "cmake .."                      //to identify cmakelists.txt in parent directory
        "make -j$(nproc)"               // compile 
        "make"
        "./vector-editor"               //run



