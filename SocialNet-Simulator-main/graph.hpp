#pragma once
#include<iostream>
#include<vector>
#include <unordered_map>
#include <string>
#include <queue>
#include <algorithm>
#include "avl.hpp"
using namespace std;

class node{
    public:
    int k;
    string s;
    avl tree;

    node(string a,int t){
        s=a;
        k=t;
    }
    ~node(){

    }
};

class graph
{
public:
    int n=0;
    vector<vector<int>> v; //adj
    vector<node*> addr;
    unordered_map<string,node*> m;


    graph(){};


void add_post(string user,string message){
    if(m.find(user)==m.end()){cout<<"No such user exist"<<endl;return;}
    m[user]->tree.insert(message);
}

void output_post(string user ,int n){
    if(m.find(user)==m.end()){cout<<"No such user exist"<<endl;return;}
    m[user]->tree.print(n);
}

    void add_ver(string s){
        string a=s;
    transform(s.begin(), s.end(), s.begin(),
              [](unsigned char c){ return tolower(c); });
              if(m.find(s)!=m.end()){cout<<"User already exist"<<endl;return;}
        node*temp=new node(a,n);
        m[s]=temp;
        n++;
        addr.resize(n);
        addr[n-1]=temp;
        v.resize(n);
        for (int i = 0; i < n; i++)
        {
           v[i].resize(n);
        }
        
    }

    void add_edge(string a,string b){
              if(m.find(a)==m.end() || m.find(b)==m.end()){cout<<"either user doesn't exist"<<endl;return;}
        int one ,two;
        one=m[a]->k;
        two=m[b]->k;
       v[one][two]=1;
    v[two][one]=1;
  }

  void ls_fnds(string a){
    if(m.find(a)==m.end()){cout<<"No such user exist"<<endl;return;}
node* user=m[a];
int num=user->k;
vector<string >name;
for (int i = 0; i < n; i++)
{
    if(v[num][i]==1){
      name.push_back(addr[i]->s);
    }
}
sort(name.begin(),name.end());
for(auto s:name){
    cout<<s<<endl;
}
cout<<"----------"<<endl;
  }

  int dos(string a,string b){
    int x,y;
    if(m.find(a)==m.end() || m.find(b)==m.end()){
    
        return -1;
    }
    x=m[a]->k;
    y=m[b]->k;
    vector<int > visited(n,0);
    queue<pair<int,int>>q;
    q.push({x,0});
    visited[x]=1;
    int ct=1;
    int dis=-1;
    while(!q.empty()){
        int pos=q.front().first;
        int prev=q.front().second;
        if(pos==y){dis=prev;break;}
        q.pop();
        for (int i = 0; i <n; i++)
        {
           if(v[pos][i] && !visited[i]){
            visited[i]=1;
            q.push({i,prev+1});
           }
        }
    }
    return dis;
  }


   static bool comp(pair<string,int> s1,pair<string ,int> s2){
        if(s1.second>s2.second || (s1.second==s2.second && s1.first<s2.first)){return true;}
        else return false;
    }


  void sugg_frnds(string s,int l){
    if(m.find(s)==m.end()){cout<<"no such user exist"<<endl;return;}
    node* user=m[s];
    unordered_map<node*,int> frnds;
    vector<int> visited(n,0);
    int key=user->k;
    visited[key]=1;
    vector<node*> temp;
    for(int i=0;i<n;i++){
        if(v[key][i]==1){
            visited[i]=1;
        if(i!=key){temp.push_back(addr[i]);}
    }
    }

    for(auto & p:temp){
        for(int i=0;i<n;i++){
            if(v[p->k][i]==1 && !visited[i]){
                frnds[addr[i]]++;
            }
        }
    }
    vector<pair<string ,int>> naveen;
    for(auto &p:frnds){
        naveen.push_back({p.first->s,p.second});
    }
    sort(naveen.begin(),naveen.end(),comp);                                            
    naveen.resize(naveen.size());
    int j=naveen.size();
    for (int i = 0; i < min(l,j); i++)
    {
        cout<<naveen[i].first<<endl;

    }
    


  }


    ~graph(){};
};
