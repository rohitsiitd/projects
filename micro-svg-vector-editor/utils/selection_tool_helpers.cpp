#include "Canvas.h"
void Canvas::drawSelectionMarker(QPainter& painter, const QRectF& bbox) {
    QRectF r =bbox;

    // Dotted rectangle
    QPen markerPen(Qt::blue);
    markerPen.setWidthF(1.0);
    markerPen.setStyle(Qt::DashLine);
    painter.setPen(markerPen);
    painter.setBrush(Qt::NoBrush);
    painter.drawRect(r);
    // Handles
    qreal H=6.0;
    QPen handle_pen(Qt::blue);
    handle_pen.setWidthF(1.0);
    QBrush handle_brush(Qt::white);
    painter.setPen(handle_pen);
    painter.setBrush(handle_brush);
    auto draw_handle = [&](QPointF c) {
        painter.drawRect(QRectF(c.x()-H/2,c.y()-H/2,H,H));                  // draw all the four handles on corners
    };
    draw_handle(r.topLeft());
    draw_handle(r.topRight());
    draw_handle(r.bottomLeft());
    draw_handle(r.bottomRight());
}

std::string Canvas::detecthandle(const QPointF& pos) {

    if (!selected_item) return "";
    QRectF r=selected_item->boundingbox();
    const qreal s=10;                            // handle size
    const qreal half=s / 2;
    QRectF tl(r.topLeft()-QPointF(half,half),QSizeF(s,s));
    QRectF tr(r.topRight()-QPointF(half,half),QSizeF(s,s));
    QRectF bl(r.bottomLeft()-QPointF(half,half),QSizeF(s,s));
    QRectF br(r.bottomRight()-QPointF(half,half),QSizeF(s,s));

    if (tl.contains(pos))return "TL";
    if (tr.contains(pos))return "TR";
    if (bl.contains(pos))return "BL";
    if (br.contains(pos))return "BR";

    return "";
}

