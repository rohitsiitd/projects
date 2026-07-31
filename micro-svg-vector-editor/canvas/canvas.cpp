#include "Canvas.h"


Canvas::Canvas(QWidget* parent)
    : QWidget(parent)
{
    setAutoFillBackground(false);
    setMouseTracking(true);                                                 // main drawing canvas
    drawing=false;
    QColor currentStrokeColor=Qt::red;                                       //default values
    QColor currentFillColor=Qt::transparent;
    double currentStrokeWidth=1.0;
    font=QFont("Arial",12);
    currentpath=QPainterPath();


}

void Canvas::setfontfamily(QString s){
    font.setFamily(s);                                      // setter for fontfamily,font size,fill ,stroke colors 
}                                                            // from toolbar to canvas members
void Canvas::setfontsize(int val){
    font.setPointSize(val);
}
void Canvas::set_fill_color(QColor c){
    if(c.isValid()){
        currentFillColor=c;
    }
    else{
        c=Qt::transparent;
    }
}

void Canvas::set_stroke_color(QColor c){
    if(c.isValid()){
        currentStrokeColor=c;
    }
    else{
        currentStrokeColor=Qt::red;
    }
}

void Canvas::set_stroke_width(double q){
    currentStrokeWidth=q;
}


void Canvas::erase_shape(QPoint pt){                                //erase the shape on which erase tool is clicked by finding the shape
    changed=true;                                                   // which contains that point
    for(int i=store.size()-1;i>=0;i--){
        if(store[i]->contains(pt)){
            savestate();
            store.erase(store.begin()+i);
            update();
            return;}
    }
}
void Canvas::apply(){                               // for applying changes on the selected shapes like stroke color,width and fill
    changed=true;
    if(selected_item==NULL) return;
    savestate();
    selected_item->setStrokeColor(currentStrokeColor);
    selected_item->setFillColor(currentFillColor);
    selected_item->setStrokeWidth(currentStrokeWidth);
    selected_item->changetextsize(font);
    update();
}


