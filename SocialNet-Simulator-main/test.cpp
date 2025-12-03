#include<iostream>
#include<vector>
#include <unordered_map>
#include <string>
#include "graph.hpp"
#include <sstream>
#include <fstream>
using namespace std;


int main(){
    // ifstream inputfile("input.txt");          // correct name
    // freopen("output.txt", "w", stdout);       // redirect output

    // if (!inputfile.is_open()) {
    //     cerr << "Error: could not open input file.\n";
    //     return 1;
    // }

    graph g;
    string line,a,b,c;
while(true){
    a.clear();b.clear();c.clear();line.clear();
    getline(cin,line);
    stringstream ss(line);
ss>>a>>b;
getline(ss,c);

if (!c.empty() && c[0] == ' ') c.erase(0, 1);
if(a=="exit"){break;}
if(a=="ADD_USER"){ g.add_ver(b);}

else if(a=="ADD_FRIEND"){ 
    
     transform(b.begin(), b.end(), b.begin(),
              [](unsigned char o){ return tolower(o); });
     transform(c.begin(), c.end(), c.begin(),
              [](unsigned char o){ return tolower(o); });
 
    g.add_edge(b,c);}

else if(a=="LIST_FRIENDS"){
    transform(b.begin(), b.end(), b.begin(),
              [](unsigned char o){ return tolower(o); });
              g.ls_fnds(b);
}
else if(a=="SUGGEST_FRIENDS"){
     transform(b.begin(), b.end(), b.begin(),
              [](unsigned char o){ return tolower(o); });
  
 
   
    int n = 0;
bool flag = true;
for (char s : c) {
    if ('0' <= s && s <= '9') {
        n = n * 10 + (s - '0');
    } else {
        flag = false;
        break;
    }
}
if (!flag) {
    cout << "ENTER VALID NUM" << endl;continue;
}
g.sugg_frnds(b,n);
}

else if(a=="DEGREE_OF_SEPARATION"){
     transform(b.begin(), b.end(), b.begin(),
              [](unsigned char o){ return tolower(o); });
     transform(c.begin(), c.end(), c.begin(),
              [](unsigned char o){ return tolower(o); });
 
    cout<<g.dos(b,c)<<endl;
}

else if(a=="ADD_POST"){
     transform(b.begin(), b.end(), b.begin(),
              [](unsigned char o){ return tolower(o); });
     transform(c.begin(), c.end(), c.begin(),
              [](unsigned char o){ return tolower(o); });
 
    g.add_post(b,c);
}

else if(a=="OUTPUT_POSTS"){
     transform(b.begin(), b.end(), b.begin(),
              [](unsigned char o){ return tolower(o); });
        if(c=="-1"){g.output_post(b,-1);}   
   else {          
     int n = 0;
bool flag = true;
for (char s : c) {
    if ('0' <= s && s <= '9') {
        n = n * 10 + (s - '0');
    } else {
        flag = false;
        break;
    }

}
if (!flag) {
    cout << "ENTER VALID NUM" << endl;continue;
}
g.output_post(b,n);}

}
else{cout<<"Enter Valid command"<<endl;continue;}
}
}