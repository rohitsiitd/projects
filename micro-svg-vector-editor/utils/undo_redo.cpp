#include "Canvas.h"

void Canvas::undo() {
    if (undo_deque.empty())return;                                      //max allowed undos are upto 25
    selected_item=NULL;
    std::vector<std::shared_ptr<Shape>> currentSnapshot;
    for (auto& s : store)                                   
        currentSnapshot.push_back(s->copy());
    redo_deque.push_back(currentSnapshot);                  // push current state into redo
    store = undo_deque.back();                              //fall to previous state
    undo_deque.pop_back();
    update();
}


void Canvas::redo() {
    if (redo_deque.empty())
        return;
    std::vector<std::shared_ptr<Shape>> currentSnapshot;
    for (auto& s : store)
        currentSnapshot.push_back(s->copy());
    undo_deque.push_back(currentSnapshot);                              //push current state into undo
    store = redo_deque.back();                                          // go to next state
    redo_deque.pop_back();  
    update();
}

void Canvas::savestate() {                                          // when called stores the current state in undo deque
    std::vector<std::shared_ptr<Shape>> snapshot;
    for (auto& s : store) {
        snapshot.push_back(s->copy());   // deep copy store 
    }
    undo_deque.push_back(snapshot);
    redo_deque.clear();
    const int MAX_HISTORY = 25;
    if (undo_deque.size() > MAX_HISTORY)
        undo_deque.pop_front();
}
