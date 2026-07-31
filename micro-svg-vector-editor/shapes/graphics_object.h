#ifndef GRAPHICS_OBJECT_H
#define GRAPHICS_OBJECT_H
#include <QColor>
#include <QPainter>
#include <QPointF>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <QPainterPath>
#include <QPainterPathStroker>
#include <QDebug>
class Shape {
public:
    virtual ~Shape() = default;
    virtual void draw(QPainter& painter) const = 0;
    virtual bool contains(const QPointF& p) const = 0;              // check if a point lies inside the shape's bounding box
    virtual std::string to_svg() const=0;                       // ouput svg code for each shape
    virtual std::shared_ptr<Shape> copy()const= 0;              // returns copy of the item
    virtual QRectF boundingbox() const=0;                           // return shape's bounding box
    virtual void move(qreal dx,qreal dy) =0;                        // to functions for move one by displacement and other by position
    virtual void move(QPointF p)=0;
    virtual void resize(std::string s,QPointF p){}
    virtual void changetext(const QString& text,const QFont & f) {}    // specifically for Text
    virtual void changetextsize(const QFont &f){}                       // specifically for text
    void setStrokeColor(const QColor& c)    { strokeColor_ = c; }       //these three are common to all shapes
    void setFillColor(const QColor& c)   { fillColor_ = c; }
    void setStrokeWidth(double w)         { strokeWidth_ = w; }

protected:
    QColor strokeColor_ = Qt::black;
    QColor fillColor_   = Qt::red;
    double strokeWidth_ = 1.0;
};

class Rectangle : public Shape {
public:
    QRect rec;                                                             // rectangle class implements both rounded rectangle and normal rectangle
    double rx=0.0,ry=0.0;
    Rectangle(QRect rec,QColor c1 ,QColor  c2 ,double w,double rx,double ry);

    void draw(QPainter& painter) const override;
    bool contains(const QPointF& p) const override;
    std::string to_svg()const override;
    std::shared_ptr<Shape> copy() const override;
    void move(qreal dx,qreal dy) override ;
    void move(QPointF p) override;
    QRectF boundingbox() const override;
    void resize(std::string s ,QPointF p) override;

};

class Circle : public Shape {
public:
    QPointF center;
    double r;
    Circle(QPointF center,double r,QColor c1 ,QColor  c2 ,double w);

    void draw(QPainter& painter) const override;
    bool contains(const QPointF& p) const override;
    std::string to_svg()const override;
    std::shared_ptr<Shape> copy() const override;
    void move(qreal dx,qreal dy) override ;
    void move(QPointF p) override;
    QRectF boundingbox() const override;
    void resize(std::string s ,QPointF p) override;

};
class Line : public Shape {
public:
    QLine line;

    Line(QLine line,QColor c1 ,QColor  c2 ,double w);

    void draw(QPainter& painter) const override;
    bool contains(const QPointF& p) const override;
    std::string to_svg()const override;
    std::shared_ptr<Shape> copy() const override;
    void move(qreal dx,qreal dy) override ;
    void move(QPointF p) override;
    QRectF boundingbox() const override;
    void resize(std::string s ,QPointF p) override;

};
class Hexagon : public Shape {
public:
    QPointF a,b;
    QPolygonF hex;
    std::vector<double> X;
    std::vector<double> Y;
    Hexagon(QPointF a, QPointF b,QColor c1 ,QColor  c2 ,double w);
    Hexagon(std::vector<double> &X,std::vector<double> &Y,QColor c1 ,QColor  c2 ,double w);

    void draw(QPainter& painter) const override;
    bool contains(const QPointF& p) const override;
    std::string to_svg()const override;
    std::shared_ptr<Shape> copy() const override;
    void move(qreal dx,qreal dy) override  ;
    void move(QPointF p) override;
    QRectF boundingbox() const override;
    void resize(std::string s ,QPointF p) override;

};
class Freehand : public Shape {
public:
    Freehand(const QPainterPath& path,
             QColor fill,
             QColor stroke,
             double width);

    void draw(QPainter& painter) const override;
    bool contains(const QPointF& p) const override;
    void move(qreal dx,qreal dy) override;
    void move(QPointF p) override;
    std::shared_ptr<Shape> copy() const override;
    std::string to_svg() const override;
    QRectF boundingbox() const override;


private:
    QPainterPath path_;
    QRectF hitbox_;
};


class Text : public Shape {
public:
    QPointF pos;
    QString text;
    QFont font;

    Text(QPointF pos,QString text,QFont font,QColor c1,QColor c2,double w);

    void draw(QPainter& painter) const override;
    bool contains(const QPointF& p) const override;
    std::string to_svg()const override;
    void changetext(const QString &s,const QFont &f) override ;
    std::shared_ptr<Shape> copy() const override;
    void move(qreal dx,qreal dy) override ;
    void move(QPointF p) override;
     QRectF boundingbox() const override;
     void resize(std::string s ,QPointF p) override;
     void changetextsize(const QFont &f) override;


};

#endif //GRAPHICS_OBJECT_H

