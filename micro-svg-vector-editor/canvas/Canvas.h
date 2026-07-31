#ifndef CANVAS_H
#define CANVAS_H

#include <QWidget>
#include <QRect>
#include <QPoint>
#include "graphics_object.h"
#include <memory>
#include <vector>
#include <QFileDialog>
#include <QMessageBox>
#include <fstream>
#include <sstream>
#include <QCursor>
#include <QPainterPath>
#include <QPainter>
#include <deque>
#include <QMouseEvent>
#include <QInputDialog>
#include <QLineEdit>


class Canvas : public QWidget
{
    Q_OBJECT
public:
    std::string current_tool;
    explicit Canvas(QWidget *parent = nullptr);
    void set_stroke_color(QColor);
    void set_fill_color(QColor);
    void set_stroke_width(double);
    void setfontfamily(QString s);
    void setfontsize(int val);
    void setradx(double x){radx=x;}
    void setrady(double y){rady=y;}
    void undo();
    void redo();
    bool changed=false;
    std::string filepath;
    void save();
    void saveas();
    void open();
    std::string close();
    void newcanvas();
    void copy();
    void apply();
    void cut();
    void paste();
    void savestate();
    void delete_fig();
    std::string detecthandle( const QPointF &p);
    std::deque<std::vector<std::shared_ptr<Shape>>> undo_deque,redo_deque;

protected:
    void paintEvent(QPaintEvent *event) override;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;

private:
    QPainterPath currentpath;
    std::shared_ptr<Shape> selected_item,copied_item;
    QColor currentStrokeColor;
    QColor currentFillColor;
    double currentStrokeWidth=1.0;
    double radx=20.0,rady=20.0;
    bool drawing;
    QFont font;
    QPoint st_pt;
    QPoint ct_pt;
    std::vector<std::shared_ptr<Shape>> store;
    void erase_shape(QPoint erase_pt);
    void readsvg();
    std::string extract(std::string &temp,const std::string &m);
    void drawSelectionMarker(QPainter &p,const QRectF & rect);
    bool isdragging = false;
    bool isresizing=false;
    std::string handle;
    QPoint lastmousepos;


signals:
};

#endif // CANVAS_H
