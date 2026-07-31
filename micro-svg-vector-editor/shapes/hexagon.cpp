#include "graphics_object.h"
Hexagon::Hexagon(QPointF a,QPointF b, QColor c1, QColor c2, double w)
    : Shape(),a(a), b(b){
    this->setFillColor(c1);
    this->setStrokeColor(c2);
    this->setStrokeWidth(w);
    QLineF temp(a,b);
    qreal r=temp.length();
    for (int i = 0; i < 6; ++i) {
        double angle = M_PI / 3 * i;
        double x=a.x()+r*cos(angle);
        double y=a.y()+r*sin(angle);
        X.push_back(x);                             // maintaining  a list of points on hexagon
        Y.push_back(y);                              
        this->hex << QPointF(x,y);                  // simulatenously creating the QPolygon
    }
}
QRectF Hexagon::boundingbox() const {
    return hex.boundingRect();                      // inbuilt method for bounding rectangle
}

Hexagon::Hexagon(std::vector<double> &Xi,std::vector<double> &Yi,QColor c1 ,QColor  c2 ,double w){
    this->setFillColor(c1);
    this->setStrokeColor(c2);
    this->setStrokeWidth(w);
    qreal t1,t2;
    t1=t2=0;
    for(auto val:Xi){
        X.push_back(val);
        t1+=val;
    }
    for(auto val:Yi){
        Y.push_back(val);
        t2+=val;
    }
    t1/=6;                                 // t1 ,t2 are  center's x and y coordinate respectively
    t2/=6;
    a=QPointF(t1,t2);
    b=QPointF(X[0],Y[0]);                    // b is taken to be arbitrary point among 6 for completeness
    for(int i=0;i<6;i++){
        this->hex<<QPointF(X[i],Y[i]);
    }

}

void Hexagon::draw(QPainter& painter) const {
    QPen pen(strokeColor_);
    pen.setWidthF(strokeWidth_);
    painter.setPen(pen);
    painter.setBrush(fillColor_);
    painter.drawPolygon(this->hex);
}

std::string Hexagon::to_svg() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);

    oss << "<polygon points=\"";
    for(int i=0;i<6;++i) {
        if(i>0)oss<< ",";
        oss<<X[i]<<","<<Y[i];
    }
    oss << "\"\n";
    oss << " stroke=\"" << strokeColor_.name().toStdString()
        << "\" stroke-width=\"" << strokeWidth_
        << "\" fill=\"" << fillColor_.name().toStdString()
        << "\" />\n";

    return oss.str();
}

void Hexagon::move(qreal dx,qreal dy) {
    hex.clear();
    for(int i=0;i<6;i++){
        this->hex<<QPointF(X[i]+dx,Y[i]+dy);            // translating all the points
        X[i]=X[i]+dx;
        Y[i]=Y[i]+dy;
    }
    this->a+=QPointF(dx,dy);                          


}

void Hexagon::move(QPointF p) {
    qreal dx,dy;
    dx=p.x()-a.x();
    dy=p.y()-a.y();
    hex.clear();
    for(int i=0;i<6;i++){
        this->hex<<QPointF(X[i]+dx,Y[i]+dy);
        X[i]=X[i]+dx;
        Y[i]=Y[i]+dy;
    }
    this->a+=QPointF(dx,dy);
}

bool Hexagon::contains(const QPointF &p) const{
    return this->hex.containsPoint(p,Qt::OddEvenFill);
}

void Hexagon::resize(std::string s, QPointF p){
    hex.clear();
    X.clear();
    Y.clear();
    qreal r=QLineF(p,a).length();
    for (int i=0;i<6;++i) {
        double angle = M_PI / 3 * i;
        double x=a.x()+r*cos(angle);        // recalculating on the basis of new radius
        double y=a.y()+r*sin(angle);
        X.push_back(x);
        Y.push_back(y);
        this->hex << QPointF(x,y);
    }
}
std::shared_ptr<Shape> Hexagon::copy() const {
    auto t1=X;
    auto t2=Y;
    return std::make_shared<Hexagon>(t1,t2,fillColor_,strokeColor_,strokeWidth_);
}

