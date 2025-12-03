
#pragma once

#include <vector>
#include<iostream>
template<typename x,typename y>
class map{
    public:
    int cap;
    int size;
    int p=53;
    long long int m=1e9+9;
    std::vector<std::vector<std::pair<x,y>>> arr;
    map(){cap=29;
        size=0;
     arr= std::vector<std::vector<std::pair<x,y>>>(cap);
    }

   void insert(int key,y val){
    if((double)size/cap>0.7){resize();}
    int t=key;
   if(t<0){t=cap-1*((-1*key)%cap);}
   else{t=key%cap;}
    for (auto &kv : arr[t]) {
            if (kv.first == key) {
                kv.second = val; 
                return;
            }
        }

    arr[t].push_back({key,val});
    size++;
   }

   void insert(std::string key,y value){
    if(size/cap>0.7){resize();}
    long long int val=0;
    long long int mul=1;
      for (int i = 0; i < key.length(); i++)
    {
          val=(val+(1LL*key[i]*mul)%m)%m;
        mul=(mul*p) % m; // keep mul bounded
    }
    val=val%cap;
     for (auto &kv : arr[val]) {
            if (kv.first == key) {
                kv.second = value; 
                return;
            }
        }
    arr[val].push_back({key,value});
    size++;
   }

   y get(int key){
    int t=key;
   if(t<0){t=cap-1*(-1*key)%cap;}
   else{t=key%cap;}
    for(int i=0;i<arr[t].size();i++){
       if(arr[t][i].first==key){return arr[t][i].second; }
    }
    return y();
   }

    y get(std::string key){
     long long int val=0;
    long long int mul=1;
    for (int i = 0; i < key.length(); i++)
    {
          val=(val+(1LL*key[i]*mul)%m)%m;
        mul=(mul*p) % m; // keep mul bounded
    }
    val=val%cap;
    for (int i = 0; i < arr[val].size(); i++)
    {
        if(arr[val][i].first==key){
            return arr[val][i].second;
        }
    }
    return y();
    
   }
void resize() {
    static const std::vector<int> prime_caps = {
        29, 59, 113, 229, 467, 953, 1979, 4019, 8011, 16001,
        32003, 64007, 128021, 256019, 512021, 1024043
    };

        int oldCap = cap;
    for (int p : prime_caps) {
        if (p > cap) {
            cap = p;
            break;
        }
    }
    std::vector<std::vector<std::pair<x, y>>> oldArr = arr;
    arr.clear();
    arr.resize(cap);
    size = 0;

    for (int i = 0; i < oldCap; ++i) {
        for (auto &p : oldArr[i]) {
            insert(p.first, p.second);  // rehash with new cap
        }
    }

}



   ~map(){
    for(int i=0;i<cap;i++){
        arr[i].clear();
    }
 
   }

};
