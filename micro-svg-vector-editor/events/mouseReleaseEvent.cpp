#include "Canvas.h"

void Canvas::mouseReleaseEvent(QMouseEvent *event){
    isdragging = false;                                     //set drag and resize flags to false
    isresizing=false;
    if(event->button()==Qt::LeftButton && drawing && current_tool!="erase" ){
        drawing=false;
        ct_pt=event->pos();
        if(current_tool=="Line"){                   // finding the appropriate dimension from st pt and ct pt and storing figures
            QLine line(st_pt,ct_pt);
            store.push_back(std::make_shared<Line>(line,currentFillColor,currentStrokeColor,currentStrokeWidth));
        }

        else if(current_tool=="Freehand"){
            store.push_back(std::make_shared<Freehand>(currentpath,currentFillColor,currentStrokeColor,currentStrokeWidth));
            currentpath=QPainterPath();
        }

        else if(current_tool=="Rounded_rect"){
            QRect rect(st_pt,ct_pt);
            store.push_back(std::make_shared<Rectangle>(rect,currentFillColor,currentStrokeColor,currentStrokeWidth,radx,rady));
        }

        else if(current_tool=="Rectangle"){
            QRect rec(st_pt,ct_pt);
            store.push_back(std::make_shared<Rectangle>(rec.normalized(),currentFillColor,currentStrokeColor,currentStrokeWidth,0.0,0.0));
        }

        else if(current_tool=="Circle"){
            QPoint center=st_pt;
            QLineF lin(st_pt,ct_pt);
            int r=lin.length();
            store.push_back(std::make_shared<Circle>(center,r,currentFillColor,currentStrokeColor,currentStrokeWidth));
        }

        else if(current_tool=="Hexagon"){
            store.push_back(std::make_shared<Hexagon>(st_pt,ct_pt,currentFillColor,currentStrokeColor,currentStrokeWidth));

        }
        update();

    }
}
