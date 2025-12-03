#pragma once
#include<iostream>
#include <vector>


template<typename x, typename compare >
class heap {
private:
    std::vector<x> &hp;
    compare comp;

    int parent(int i) { return (i - 1) / 2; }
    int left(int i) { return 2 * i + 1; }
    int right(int i) { return 2 * i + 2; }

    void heapifydown(int i, int n) {
        int smallest = i;
        if (left(i) < n && comp(hp[left(i)], hp[smallest])) {
            smallest = left(i);
        }
        if (right(i) < n && comp(hp[right(i)], hp[smallest])) {
            smallest = right(i);
        }
        if (smallest != i) {
            std::swap(hp[i], hp[smallest]);
            heapifydown(smallest, n);
        }
    }

    void heapifyup(int i) {
        while (i > 0 && comp(hp[i], hp[parent(i)])) {
            std::swap(hp[i], hp[parent(i)]);
            i = parent(i);
        }
    }

public:

    heap(std::vector<x>& arr, compare cmp) : hp(arr), comp(cmp) {
        makeheap();
    }

    void makeheap() {
        for (int i = (int)hp.size() / 2 - 1; i >= 0; --i) {
            heapifydown(i, (int)hp.size());
        }
    }

    void push(const x& val) {
        hp.push_back(val);
        heapifyup((int)hp.size() - 1);
    }

    x pop() {
        if (hp.empty()) return x();
        x t=hp[0];
        std::swap(hp[0], hp[hp.size()-1]);
        hp.pop_back();
        heapifydown(0, (int)hp.size());
        return t;
    }
    void empty(){
        return hp.size()==0;
    }
    void heapsort() {
        int n = (int)hp.size();
        makeheap();
        for (int i = n - 1; i > 0; --i) {
            std::swap(hp[0], hp[i]);
            heapifydown(0, i);
        }
    }
    void get(typename std::vector<x>& temp) {
    temp = hp;
}
   
};
