#include "graphics_object.h"
Rectangle::Rectangle(QRect rec, QColor c1, QColor c2, double w,double rx,double ry)
    : Shape(),              // Call parent default constructor
    rec(rec),rx(rx),ry(ry) {            // Initialize Rectangle's member
    setStrokeColor(c2);
    setFillColor(c1);
    setStrokeWidth(w);
}

void Rectangle::draw(QPainter & painter) const{
    QPen pen(strokeColor_);
    pen.setWidth(strokeWidth_);
    painter.setPen(pen);
    painter.setBrush(fillColor_);
    if(rx>0 || ry>0) painter.drawRoundedRect(rec.normalized(),rx,ry);    //for rounded rectangle
    else{painter.drawRect(rec);}                                            // for normal rectangle
}
QRectF Rectangle::boundingbox() const{
    return rec;
}
bool Rectangle::contains(const QPointF &p) const{
    return this->rec.contains(p.toPoint());
}
std::string Rectangle::to_svg() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);

    oss << "<rect x=\"" << rec.x()
        << "\" y=\"" <<rec.y()
        << "\" width=\"" <<rec.width()
        << "\" height=\"" <<rec.height();

    if(rx>0||ry>0) {
        oss << "\" rx=\"" <<rx
            << "\" ry=\"" <<ry;
    }

    oss << "\"\n"
        << " stroke=\"" <<strokeColor_.name().toStdString()
        << "\" stroke-width=\"" <<strokeWidth_
        << "\" fill=\"" <<fillColor_.name().toStdString()
        << "\" />\n";

    return oss.str();
}
void Rectangle::move(qreal dx,qreal dy) {
    qreal h=rec.height();
    qreal w=rec.width();
     rec.translate(dx, dy);
}
void Rectangle::move(QPointF p) {
    qreal dx,dy;
    dx=p.x()-rec.center().x();
    dy=p.y()-rec.center().y();
    qreal h=rec.height();
    qreal w=rec.width();
    rec.translate(dx, dy);
}
void Rectangle::resize(std::string handle, QPointF pos) {
    QRect r = rec;
    if(handle=="TL"){r.setTopLeft(pos.toPoint());}
    else if(handle=="TR"){r.setTopRight(pos.toPoint());}                   // resizing based on the handle stretched
    else if(handle=="BL"){ r.setBottomLeft(pos.toPoint());}
    else if(handle=="BR"){ r.setBottomRight(pos.toPoint());}
    rec = r.normalized();                                                       // for correcting -ve lengths
}

std::shared_ptr<Shape> Rectangle::copy() const {
    return std::make_shared<Rectangle>(rec,fillColor_,strokeColor_,strokeWidth_,rx,ry);

}


