#include "graphics_object.h"

Text::Text(QPointF pos,QString text,QFont font,QColor c1,QColor c2,double w):Shape(),pos(pos),font(font),text(text){
    this->setFillColor(c1);
    this->setStrokeColor(c2);
    this->setStrokeWidth(w);
}

void Text::draw(QPainter& painter) const {
    painter.setRenderHint(QPainter::Antialiasing, true);
    painter.setFont(font);
    painter.setPen(strokeColor_);
    painter.setBrush(fillColor_);
    painter.drawText(pos, text);
}
std::string Text::to_svg() const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);

    oss << "<text x=\"" << pos.x()
        << "\" y=\"" << pos.y()   
        << "\" font-size=\"" << font.pointSizeF()   // Convert points to px
        << "\" font-family=\"" << font.family().toStdString()
        << "\" stroke=\"" << strokeColor_.name().toStdString()
        << "\" stroke-width=\"" << strokeWidth_
        << "\" fill=\"" << fillColor_.name().toStdString()
        << "\">" << text.toStdString()
        << "</text>\n";

    return oss.str();
}
void Text::changetext(const QString &t,const QFont &f){
    text=t;
    font.setFamily(f.family());                                                 // for changes in attributes
    font.setPointSize(f.pointSize());
}
bool Text::contains(const QPointF &p) const{
    QFontMetricsF fm(font);
   auto textSize = fm.size(Qt::TextSingleLine, text);
    QRectF hitRect(pos.x(), pos.y()-textSize.height()/2,                       
                   textSize.width(), textSize.height());
    hitRect.adjust(-8, -8, 8, 8);                                           //adjusting margins
    return hitRect.contains(p);
}
QRectF Text::boundingbox() const {

    QFontMetricsF fm(font);
    qreal width = fm.horizontalAdvance(text);
    qreal height = fm.height();
    qreal ascent = fm.ascent();
    QPointF topLeft(pos.x(), pos.y() - ascent);                             // Top-left must be baseline - ascent

    return QRectF(topLeft, QSizeF(width, height));
}
void Text::move(qreal dx,qreal dy)
{
    pos+=QPointF(dx,dy);
}
void Text::move(QPointF p)
{
    pos=p;
}
void Text::resize(std::string handle, QPointF p) {
   if (handle != "BR") return;                                         // for now only bottom-right supported                                   
   QRectF box = boundingbox();
   qreal new_width = p.x() - box.left();
   qreal new_ht = p.y() - box.top();
   if (new_width <= 5 || new_ht <= 5) return;
   QFontMetricsF metrics(font);
   qreal ct_height = metrics.height();
   if (ct_height <= 0) return;
   qreal scale = new_ht / ct_height;
   int new_size = std::max(1, int(font.pointSizeF() * scale));
   font.setPointSize(new_size);
}


void Text::changetextsize(const QFont &f) {
    font.setFamily(f.family());
    font.setPointSize(f.pointSize());
}
std::shared_ptr<Shape> Text::copy() const {
    return std::make_shared<Text>(pos,text,font,fillColor_,strokeColor_,strokeWidth_);

}
