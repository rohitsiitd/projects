#ifndef MAINWINDOW_H
#define MAINWINDOW_H
#include <QMainWindow>
#include <QToolBar>
#include <QAction>
#include <QCloseEvent>
#include <vector>
#include <string>
#include <QSpinBox>
#include <QFontComboBox>
#include <QInputDialog>
#include "Canvas.h"
#include <QColorDialog>
#include <QSlider>
#include <QPushButton>
#include <QToolButton>
#include <QFormLayout>
#include <QLabel>
#include <QMenu>
#include <QLineEdit>
#include <QMessageBox>
#include <QWidgetAction>
#include <QScrollArea>
#include <QMenuBar>
#include <QApplication>

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    void create_buttons();
    void connect_buttons();
    void setshortcut();
    void addbuttons();
    void add_actions();
    void menu_buttons();
    MainWindow(QWidget *parent = nullptr);
    void closeEvent(QCloseEvent *event) override;
    ~MainWindow();

private:
    Canvas* canvas;
    QSpinBox* fontSizeInput = nullptr;
    QFontComboBox* fontFamilyCombo = nullptr;
    QToolBar *toolbar;
    Ui::MainWindow *ui;
    QAction *erase;
    QAction *draw_rec;
    QAction *draw_line;
    QAction *draw_hex;
    QAction * freehand;
    QAction *draw_cir;
    QAction *select;
    QAction *apply;
    QAction* newaction;
    QAction* Openaction;
    QAction* saveaction;
    QAction* undoaction;
    QAction* redoaction;
    QAction* cutaction;
    QAction* copyaction;
    QAction* pasteaction;
    QAction* closeaction;
    QAction* saveasaction;
    QAction* delete_action;
    QMenu * filemenu;
    QPushButton* strokeclrbtn;
    QPushButton* fillcolorbtn;
    QSlider * slider;
    QMenu* menu;
};
#endif // MAINWINDOW_H
