#include "Canvas.h"


    void Canvas::paintEvent(QPaintEvent* event)
    {
        Q_UNUSED(event);

        QPainter painter(this);
        painter.setRenderHint(QPainter::Antialiasing,true);
        painter.fillRect(rect(), Qt::white);

        for(auto &rt:store){
            rt->draw(painter);                                                  //draw all shapes on update()

        }
        if (selected_item) {
            drawSelectionMarker(painter, selected_item->boundingbox());        // draw slection marker on selecteditem
            update();

        }

        if (current_tool == "Freehand" && !currentpath.isEmpty()) {
            QPen pen(currentStrokeColor,
                     currentStrokeWidth,
                     Qt::SolidLine,                                     // live preview for freehand drawing
                     Qt::RoundCap,
                     Qt::RoundJoin);
            painter.setPen(pen);
            painter.setBrush(Qt::NoBrush);
            painter.drawPath(currentpath);
        }
        else if (drawing){
            changed=true;
            if(current_tool=="Rectangle"){                          // live preview for other shapes while drawing is true
                QRect rect(st_pt,ct_pt);
                Rectangle rec(rect,currentFillColor,currentStrokeColor,currentStrokeWidth,0.0,0.0);
                rec.draw(painter);
            }
            else if(current_tool=="Line"){
                QLine line(st_pt,ct_pt);
                Line lin(line,currentFillColor,currentStrokeColor,currentStrokeWidth);
                lin.draw(painter);
            }
            else if(current_tool=="Rounded_rect"){
                QRect rect(st_pt,ct_pt);
                Rectangle rec(rect,currentFillColor,currentStrokeColor,currentStrokeWidth,radx,rady);
                rec.draw(painter);
            }
            else if(current_tool=="Circle"){
                QPoint center=st_pt;
                QLineF lin(st_pt,ct_pt);
                int r=lin.length();
                Circle cir(center,r,currentFillColor,currentStrokeColor,currentStrokeWidth);
                cir.draw(painter);
            }
            else if(current_tool=="Hexagon"){
                Hexagon hex(st_pt,ct_pt,currentFillColor,currentStrokeColor,currentStrokeWidth);
                hex.draw(painter);
            }
        }
    }


