
#include<iostream>
#include <vector>
#include <string>
#include <ctime>
#include "heap.hpp"
#include "Tree.hpp"
#include "map.hpp"
#include <sstream>
using namespace std;


struct modifiedtime {
    bool operator()(pair<string ,time_t> a, pair<string ,time_t> b) const {
        return a.second >= b.second;
    }
};

struct nodect {
    bool operator()(pair<string,int>a, pair<string,int> b) const {
        return a.second >= b.second;
    }
};

void bigtrees(vector<pair<string ,int>> f,int num){
    heap<pair<string,int>,nodect> h(f,nodect{});
    for (int i = 0; i < num; i++)
    {
       pair<string,int> temp=h.pop();
        cout<<"name: "<<temp.first<<" version count: "<<temp.second<<endl;

    }

}

void recentfiles( vector<pair<string ,time_t>> f,int num){
      heap<pair<string ,time_t>,modifiedtime> h(f,modifiedtime{});
    for (int i = 0; i < num; i++)
    {
        pair<string ,time_t> temp=h.pop();
        cout<<"name: "<<temp.first<<" last modification time: "<<ctime(&temp.second);

    }
}

int main(){
 vector<pair<string ,time_t>> f;
 vector<pair<string ,int> >g;
 map<string,Tree*> m;
string line,a,b,c;
while(true){
    a.clear();b.clear();c.clear();line.clear();
    getline(cin,line);
    stringstream ss(line);
ss>>a>>b;
getline(ss,c);
if(!c.empty() && c[0] == ' ') c.erase(0,1);

if(a=="exit"){break;}

if(a=="CREATE" && b!=""){
    Tree* temp=new Tree();
    if (m.get(b)!=NULL){cout<<"FILE ALREADY EXISTS!"<<endl;continue;;}
    m.insert(b,temp);
    f.push_back({b,time(0)});
    g.push_back({b,0});

}   

else if(a=="READ" && b!=""){
    Tree* temp=m.get(b);
    if(temp==NULL){cout<<"FILE DOESN'T EXIST!"<<endl;continue;}
   m.get(b)->read();
}   

else if(a=="INSERT" && b!=""){Tree* temp=m.get(b);
    if(temp==NULL){cout<<"FILE DOESN'T EXIST!"<<endl;continue;}
    for (int i = 0; i < f.size(); i++)
    {
       if(f[i].first==b){f[i].second=time(0);break;}
    }
    
    temp->append(c);
}

else if(a=="UPDATE" && b!=""){Tree* temp=m.get(b);
    if(temp==NULL){cout<<"FILE DOESN'T EXIST!"<<endl;continue;}
      for (int i = 0; i < f.size(); i++)
    {
       if(f[i].first==b){f[i].second=time(0);break;}
    }
    temp->update(c);
}

else if(a=="SNAPSHOT" && b!="" ){Tree* temp=m.get(b);
    if(temp==NULL){cout<<"FILE DOESN'T EXIST!"<<endl;continue;}
    temp->snapshot(c);
}

else if(a=="ROLLBACK" && b!=""){Tree* temp=m.get(b);
    while(!c.empty() && c[0] == ' ') c.erase(0,1);
    if(temp==NULL){cout<<"FILE DOESN'T EXIST!"<<endl;continue;}
    if(c==""){temp->rollback();continue;}
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
    cout << "ENTER VALID ID" << endl;
}
    temp->rollback(n);
}

else if(a=="HISTORY" && b!="" ){Tree* temp=m.get(b);
    if(temp==NULL){cout<<"NO SUCH FILE EXISTS"<<endl;continue;}
else{temp->history();}

}

else if(a=="RECENT_FILES" && b!=""){
    int n = 0;
bool flag = true;

for (char s : b) {
    if ('0' <= s && s <= '9') {
        n = n * 10 + (s - '0');
    } else {
        flag = false;
        break;
    }
}
if (!flag) {
    cout << "ENTER VALID NUM" << endl;
}
    if(n>f.size() || n<0){n=f.size();}
    recentfiles(f,n);
}
else if(a=="BIG_TREES" && b!=""){
    int n = 0;
bool flag = true;
for (char s : b) {
    if ('0' <= s && s <= '9') {
        n = n * 10 + (s - '0');
    } else {
        flag = false;
        break;
    }
}
if (!flag) {
    cout << "ENTER VALID NUM" << endl;
}
    for (int i = 0; i < g.size(); i++)
    {
        g[i].second=m.get(g[i].first)->total_versions;
    }
    if(n>g.size() || n<0){n=g.size();}
    bigtrees(g,n);
}

else{
    cout<<"ENTER VALID COMMAND"<<endl;
}

}
}