#include "Canvas.h"

void Canvas::mouseMoveEvent(QMouseEvent *event){

    if(current_tool=="select" && selected_item){
        std::string s=detecthandle(event->pos());                       //detects handle on the selected shape
    }

    if(isresizing && selected_item){
        selected_item->resize(handle,event->pos().toPointF());    //sends the current mouse location to resize of selected shape
    }
    if (isdragging && selected_item) {
        QPoint currentPos = event->pos();
        QPoint delta = currentPos - lastmousepos;
        selected_item->move(delta.x(),delta.y());                   // move the items based on change in position of mouse
        update();
        lastmousepos = currentPos;
    }
    if(drawing ){
        ct_pt=event->pos();
        if(current_tool=="Freehand"){
            currentpath.lineTo(ct_pt);                      // keep adding points in the painterpath while freehand
        }   
    }
    else{return;}
    update();

}
