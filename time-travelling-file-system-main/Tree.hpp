#pragma once

#include <vector>
#include<iostream>
#include <string>
#include "map.hpp"
#include "heap.hpp" 

using namespace std;


class Node{
    public:
    int version_id;
    std::string content;
    std::string message;
    time_t created_timestamp;
    time_t snapshot_timestamp;
    Node* parent;   
    std::vector<Node*> children;

    Node(int val){
version_id=val;
message="not has been snapshotted";
created_timestamp=time(0);
snapshot_timestamp=-1;
parent=NULL;
    }


};

struct snaptime {
    bool operator()(Node* a, Node* b) const {
        return a->snapshot_timestamp <= b->snapshot_timestamp;
    }
};
class Tree{
public:
    Node* root;
    Node* active_version;
    map<int,Node*> version_map;
    int total_versions=0;

    Tree(){
        root=new Node(0);
        root->parent=NULL;
        version_map.insert(0,root);
        active_version=root;
        root->snapshot_timestamp=time(0);
        root->content="";
        root->message="THIS IS ROOT";
        total_versions++;
    }
  

    void read(){cout<<"The content is: ";
        cout<<active_version->content<<endl;
        cout<<endl;
    }

    void append(string ans){
        if(active_version->snapshot_timestamp==-1){active_version->content+=ans;}
        else{Node* temp=new Node(total_versions);
            active_version->children.push_back(temp);
            temp->parent=active_version;
            temp->content=active_version->content + ans;
            active_version=temp;
            version_map.insert(total_versions,temp);
            total_versions++;
            
             }
    }


    void update(string ans){
        if(active_version->snapshot_timestamp==-1){active_version->content=ans;}
        else{Node* temp=new Node(total_versions);
            active_version->children.push_back(temp);
            temp->parent=active_version;
            active_version=temp;
            version_map.insert(total_versions,temp);
            total_versions++;
             temp->content=ans;
             }
    }

    void snapshot(string ans){
        if(active_version->snapshot_timestamp==-1){
            active_version->message=ans;
            active_version->snapshot_timestamp=time(0);
            cout<<"SNAPSHOT SUCCESSFULL"<<endl;
        }

        else{cout<<"VERSION IS ALREADY SNAPSHOTTED!"<<endl;}
    }
    void rollback(){
        if(active_version->parent!=NULL)
            {active_version=active_version->parent;}
    }
    void rollback(int id){
        if(id<0){cout<<"NO SUCH ID EXISTS!"<<endl;}
        else{Node* temp=version_map.get(id);
            if(temp==NULL){cout<<"NO SUCH ID EXISTS!"<<endl;}
            else{active_version=temp;}
        }    
    }

    void history(){cout<<"HISTORY"<<endl;
        Node* temp=active_version;
        while(temp!=NULL){
            if(temp->snapshot_timestamp!=-1){
                cout<<"ID: "<<temp->version_id<<" Time: "<<ctime(&temp->snapshot_timestamp)<<" message: "<<temp->message<<endl;
            }
            temp=temp->parent;
        }

    }


};







