#include "graphics_object.h"
Circle::Circle(QPointF center,double r,  QColor c1,  QColor c2, double w): Shape(),center(center),r(r){
    this->setFillColor(c1);
    this->setStrokeColor(c2);
    this->setStrokeWidth(w);

}
void Circle::draw(QPainter &painter) const{
    QPen pen(strokeColor_);
    pen.setWidth(strokeWidth_);
    painter.setPen(pen);
    painter.setBrush(fillColor_);
    painter.setRenderHint(QPainter::Antialiasing, true);
    painter.drawEllipse(center,r,r);
}
bool Circle::contains(const QPointF &p) const{
    return (QLineF(center,p).length()<r);

}
QRectF Circle::boundingbox() const{
    return QRectF(center.x()-r,center.y()-r,2*r,2*r);
}

std::string Circle::to_svg() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);
    oss << "<circle cx=\"" << center.x()
        << "\" cy=\"" << center.y()
        << "\" r=\"" << r << "\"\n";
    oss << "stroke=\"" << strokeColor_.name().toStdString()
        << "\" stroke-width=\"" << strokeWidth_
        << "\" fill=\"" << fillColor_.name().toStdString()
        << "\" />\n";
    return oss.str();
}
void Circle::move(qreal dx,qreal dy) {
    center+=QPointF(dx,dy);
}
void Circle::move(QPointF p) {
    center=p;
}
void Circle::resize(std::string s, QPointF p){
    r=QLineF(center,p).length();
}
std::shared_ptr<Shape> Circle::copy() const {
    return std::make_shared<Circle>(center,r,fillColor_,strokeColor_,strokeWidth_);

}

