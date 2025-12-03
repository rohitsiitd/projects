#pragma once
#include<iostream>
#include<vector>
#include <unordered_map>
#include <string>
#include <queue>
using namespace std;

class Node{
    public:
    Node* left;
    Node* right;
    int key;
    string message;
    int height;

    Node(int key,string s){
        height=0;
        this->key=key;
        message=s;
        left=NULL;
        right=NULL;
    }};


    class avl{
        public:
        int size=0;
        Node* root;
        avl(){root=NULL;}


    int height(Node* node){if(!node)return -1;
    return node->height;
}
    int getheight(Node* node){
        if(!node)return -1;
       return max(height(node->left),height(node->right))+1;
    }
    int getbalance(Node* node){
        return getheight(node->left)-getheight(node->right);
    }

Node* rightrotate(Node* x){
    Node* y=x->left;
    Node* z=y->right;
    y->right=x;
    x->left=z;

    x->height=getheight(x);
    y->height=getheight(y);

    return y;
}


Node* leftrotate(Node* x){
    Node* y=x->right;
    Node* z=y->left;
    y->left=x;
    x->right=z;

    x->height=getheight(x);
    y->height=getheight(y);

    return y;
}


    Node* inserthelper(Node* node,int key,string s){
        if(node==NULL){return new Node(key,s);}
        if(key<node->key){node->left=inserthelper(node->left,key,s);}
        else if(key>node->key){node->right=inserthelper(node->right,key,s);}
        else{return node;}


        node->height=getheight(node);
        int balance=getbalance(node);

        if(balance>1 && key<node->left->key){
            return rightrotate(node);
        }

        else if(balance>1 && key>node->left->key){
           node->left= leftrotate(node->left);
           return rightrotate(node);
        }

         else if(balance<-1 && key>node->right->key){
           return leftrotate(node);
        }

        else if(balance<-1 && key<node->right->key){
            node->right=rightrotate(node);
            return leftrotate(node);
        }

        return node;

    }


    void insert(string s){
        root=inserthelper(root,size,s);
        size++;
    }

    void deletetree(Node* node){
        if(node==NULL){return;}
        deletetree(node->left);
        deletetree(node->right);
        delete node;

    }
    void order(Node* node,vector<Node*> &v,int n){
        if(node==NULL || v.size()==n){return;}
        order(node->right,v,n);
        if(v.size()==n){return;}
        v.push_back(node);
        order(node->left,v,n);
    }
    void print(int n){
        vector<Node*> v;
        if(n==-1 || n>size){n=size;}
        order(root,v,n);
        for(auto s:v){
            cout<<s->message<<endl;
        }
        cout<<"----------"<<endl;
    }

    ~avl(){
        deletetree(root);
    }

    
};