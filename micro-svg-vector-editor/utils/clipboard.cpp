# include "Canvas.h"


void Canvas::cut(){
    if(!selected_item) return;
    changed=true;
    savestate();
    for(auto it =store.begin();it!=store.end();it++){                 //erase the shape and save it in copy pointer 
        if(*it==selected_item){
            store.erase(it);
            copied_item=selected_item;
            selected_item=NULL;
            update();
            return;

        }
    }
}

void Canvas::copy(){
    changed=true;
    if(selected_item!=NULL){
        copied_item=selected_item->copy();
    }
}


void Canvas::paste(){
    changed=true;
    savestate();
    QPointF p=mapFromGlobal(QCursor::pos());
    std::shared_ptr<Shape> newpaste=copied_item->copy();                //creates deep copy of selected shape and 
    newpaste->move(p);                                                  // paste on the current location of mouse
    store.push_back(newpaste);  
    update();
}