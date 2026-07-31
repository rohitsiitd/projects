#include "Canvas.h"


void Canvas::mousePressEvent(QMouseEvent *event){
    if(event->button()==Qt::LeftButton ){
        changed=true;
        if(current_tool=="select" && selected_item){
            std::string s=detecthandle(event->pos());
            if(s!=""){
                isresizing=true;
                savestate();                            // set isreizing true when clicked on a handle of selected item
                handle=s;
                return;

            }
        }

        if(current_tool!="select" && current_tool!="Text")
        {selected_item=NULL;}                                                // unselect

        if(current_tool=="erase"){
            QPoint erase_pt=event->pos();
            erase_shape(erase_pt);                                      //erase the item clicked upon
        }
        else if(current_tool=="select"){
            QPoint pt=event->pos();
            for(int i=store.size()-1;i>=0;i--){
                if(store[i]->contains(pt)){
                    selected_item=store[i];             //finds the point containing figure and mark it selected and make dragging
                    savestate();                           //flag true for movement and saves the state
                    isdragging = true;
                    lastmousepos = pt;
                    update();
                    return;
                }
            }
            selected_item=NULL;
            update();
        }


        else if(current_tool=="Text"){
            QPointF pos=event->pos();
            bool ok;                                                                //fetches text ,font from toolbar 
            QString text=QInputDialog::getText(this,"Add Text",
                "Enter Text:",QLineEdit::Normal,"",&ok);
            if(ok && !text.isEmpty()) {
                auto textShape = std::make_shared<Text>(                          
                    pos, text, font,  
                    currentFillColor,
                     currentStrokeColor, 
                     currentStrokeWidth
                    );
                savestate();                                            //changes or create text based on click location
                 if(selected_item&&selected_item->contains(pos))
                 {selected_item->changetext(text,font);} 
                 else store.push_back(textShape);
                update();
            }

            current_tool = ""; 
        }
        else { drawing=true;
            st_pt=event->pos();
            savestate();
            if(current_tool=="Freehand"){
                currentpath=QPainterPath();                     // add st_pt to painterpath for freehand
                currentpath.moveTo(st_pt);
            }
            ct_pt=st_pt;
            update();}
    }
    else if(current_tool!="erase" && event->button()==Qt::RightButton && drawing){
        drawing=false;
        update();
    }
}
