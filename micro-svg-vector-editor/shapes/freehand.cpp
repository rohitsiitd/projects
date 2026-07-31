#include "graphics_object.h"

Freehand::Freehand(const QPainterPath& path,QColor fill,QColor stroke,double w)
    : Shape(), path_(path)
{
    setFillColor(fill);
    setStrokeColor(stroke);                                                  //NOTE- resize is not implemented for freehand 
    setStrokeWidth(w);
    hitbox_ = path_.boundingRect();
}

void Freehand::draw(QPainter& painter) const {
    if (path_.isEmpty()) return;
    QPen pen(strokeColor_);
    pen.setWidthF(strokeWidth_);
    pen.setCapStyle(Qt::RoundCap);
    pen.setJoinStyle(Qt::RoundJoin);
    painter.setPen(pen);
    painter.setBrush(Qt::NoBrush);
    painter.drawPath(path_);
}
QRectF Freehand::boundingbox() const{
    return hitbox_;
}
bool Freehand::contains(const QPointF& p) const {
    QPainterPathStroker stroker;
    stroker.setWidth(strokeWidth_+4.0); // tolerance
    QPainterPath strokeArea = stroker.createStroke(path_);
    return strokeArea.contains(p);
}

std::string Freehand::to_svg() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);       //set precision upto two decimal places
    oss << "<path d=\"";
    for (int i = 0; i < path_.elementCount(); ++i) {
        auto e = path_.elementAt(i);
        if (i == 0)
            oss<< "M "<< e.x<<" "<<e.y<<" ";        // move to
        else
            oss<<"L "<<e.x<<" "<<e.y<<" ";          // Line to
    }

    oss << "\" stroke=\"" << strokeColor_.name().toStdString()
        << "\" stroke-width=\"" << strokeWidth_
        << "\" fill=\"none\" />\n";
    return oss.str();
}

void Freehand::move(qreal dx,qreal dy) {

    QTransform t;                                  //to apply the same transformation on all points
    t.translate(dx, dy);
    path_ = t.map(path_);
    hitbox_ = path_.boundingRect();
}
void Freehand::move(QPointF p) {
    qreal dx=p.x()-hitbox_.center().x();
    qreal dy=p.y()-hitbox_.center().y();
    QTransform t;
    t.translate(dx, dy);
    path_ = t.map(path_);
    hitbox_ = path_.boundingRect();
}


std::shared_ptr<Shape> Freehand::copy() const {
    return std::make_shared<Freehand>( path_,fillColor_, strokeColor_,strokeWidth_);
}


