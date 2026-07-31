#include "mainwindow.h"
#include "ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    canvas = new Canvas(this);
    setCentralWidget(canvas);
    toolbar= new QToolBar("Main toolbar",this);    //initialises toolbar object
    addToolBar(Qt::LeftToolBarArea,toolbar);        // insert on left
    filemenu=menuBar()->addMenu("File");             //adds file menu

    create_buttons();
    connect_buttons();                              //helpers
    setshortcut();
    addbuttons();
    add_actions();
    menu_buttons();

}
void MainWindow::closeEvent(QCloseEvent *event) {
    if(canvas->close()!="cancel"){event->accept();}
    else{
        event->ignore(); }
}
MainWindow::~MainWindow()
{
    delete ui;
}
