#include "graphics_object.h"


Line::Line(QLine line, QColor c1, QColor c2, double w):Shape(),line(line){
    this->setFillColor(c1);
    this->setStrokeColor(c2);
    this->setStrokeWidth(w);

}

void Line::draw(QPainter &painter) const{
    QPen pen(strokeColor_);
    pen.setWidth(strokeWidth_);
    painter.setPen(pen);
    painter.setBrush(fillColor_);
    painter.drawLine(line);
}
std::string Line::to_svg() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);

    oss << "<line x1=\"" << line.x1()
        << "\" y1=\"" << line.y1()
        << "\" x2=\"" << line.x2()
        << "\" y2=\"" << line.y2() << "\"\n";
    oss << " stroke=\"" << strokeColor_.name().toStdString()
        << "\" stroke-width=\"" << strokeWidth_ << "\" />\n";

    return oss.str();
}


bool Line::contains(const QPointF& p) const  {
    auto a = QPointF(line.x1(),line.y1());
    auto b = QPointF(line.x2(),line.y2());
    double num = qAbs((b.y()-a.y())*(p.x()-a.x()) - (b.x()-a.x())*(p.y()-a.y()) );
    double den = qSqrt(qPow(b.y()-a.y(),2) + qPow(b.x()-a.x(),2) );                         //distance formula from p to the line ab

    return  ((num/den)<8);        //tolerance
}
QRectF Line::boundingbox() const{
    return QRectF(line.p1(),line.p2());
}
void Line::move(qreal dx,qreal dy) {

    line.setPoints(QPoint(line.x1()+dx,line.y1()+dy),QPoint(line.x2()+dx,line.y2()+dy));
}

void Line::move(QPointF p) {
    qreal dx,dy;
    dx=p.x()-(line.x1()+line.x2())/2;
    dy=p.y()-(line.y1()+line.y2())/2;
    line.setPoints(QPoint(line.x1()+dx,line.y1()+dy),QPoint(line.x2()+dx,line.y2()+dy));  // inbuilt method
}
void Line::resize(std::string s, QPointF p){
    if(QLineF(p,line.p1()).length()<20){line.setP1(p.toPoint());}                       //20px tolerance
    else if(QLineF(p,line.p2()).length()<20){line.setP2(p.toPoint());}
}
std::shared_ptr<Shape> Line::copy() const {
    return std::make_shared<Line>(line,fillColor_,strokeColor_,strokeWidth_);

}
