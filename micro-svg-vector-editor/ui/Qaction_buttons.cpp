# include "mainwindow.h"


void MainWindow::create_buttons(){

    erase=new QAction("erase",this);
    draw_rec=new QAction("rectangle",this);
    draw_line=new QAction("Line",this);
    draw_hex=new QAction("Hexagon",this);
    freehand =new QAction("Freehand",this);
    draw_cir=new QAction("Circle",this);
    select=new QAction("Select",this);
    apply=new QAction("Apply changes",this);
    newaction= new QAction("New",this);
    Openaction=new QAction("Open",this);
    saveaction=new QAction("Save",this);
    undoaction=new QAction("Undo",this);
    redoaction=new QAction("Redo",this);
    cutaction=new QAction("Cut",this);
    copyaction=new QAction("Copy",this);
    pasteaction=new QAction("Paste",this);
    closeaction=new QAction("Close",this);
    saveasaction=new QAction("Save as",this);
    delete_action=new QAction ("delete",this);
}
void MainWindow::connect_buttons(){
    connect(erase,&QAction::triggered,[this](){canvas->current_tool="erase";});
    connect(draw_rec,&QAction::triggered,[this](){canvas->current_tool="Rectangle";});
    connect(draw_line,&QAction::triggered,[this](){canvas->current_tool="Line";});
    connect(draw_hex,&QAction::triggered,[this](){canvas->current_tool="Hexagon";});
    connect(freehand,&QAction::triggered,[this](){canvas->current_tool="Freehand";});
    connect(draw_cir,&QAction::triggered,[this](){canvas->current_tool="Circle";});
    connect(select,&QAction::triggered,[this](){canvas->current_tool="select";});
    connect(apply,&QAction::triggered,[this](){canvas->apply();});
    connect(delete_action,&QAction::triggered,[this](){canvas->delete_fig();});
    connect(saveaction,&QAction::triggered,[this](){ canvas->save();});
    connect(saveasaction,&QAction::triggered,[this](){canvas->saveas();});
    connect(closeaction, &QAction::triggered , [this](){ qApp->quit(); });
    connect(newaction, &QAction::triggered , [this](){ canvas->newcanvas(); });
    connect(copyaction,&QAction::triggered,[this](){canvas->copy();});
    connect(pasteaction, &QAction::triggered,[this](){canvas->paste();});
    connect(Openaction,&QAction::triggered,[this](){canvas->open();});
    connect(cutaction,&QAction::triggered,[this](){canvas->cut();});
    connect(undoaction,&QAction::triggered,[this](){canvas->undo();});
    connect(redoaction,&QAction::triggered,[this](){canvas->redo();});
}
void MainWindow::setshortcut(){

    saveaction->setShortcut(QKeySequence::Save);
    Openaction->setShortcut(QKeySequence::Open);
    newaction->setShortcut(QKeySequence::New);
    undoaction->setShortcut(QKeySequence::Undo);
    redoaction->setShortcut(QKeySequence::Redo);
    copyaction->setShortcut(QKeySequence::Copy);
    delete_action->setShortcut(QKeySequence::Delete);
    cutaction->setShortcut(QKeySequence::Cut);
    pasteaction->setShortcut(QKeySequence::Paste);
}

void MainWindow::addbuttons(){
    toolbar->addAction(erase);
    toolbar->addSeparator();

    toolbar->addAction(draw_rec);
    toolbar->addSeparator();

    toolbar->addAction(draw_line);
    toolbar->addSeparator();

    toolbar->addAction(draw_hex);
    toolbar->addSeparator();

    toolbar->addAction(freehand);
    toolbar->addSeparator();

    toolbar->addAction(draw_cir);
    toolbar->addSeparator();


    toolbar->addAction(select);
    toolbar->addSeparator();

    toolbar->addAction(apply);
    toolbar->addSeparator();
}
void MainWindow::add_actions(){
    filemenu->addAction(newaction);
    filemenu->addAction(Openaction);
    filemenu->addAction(saveaction);
    filemenu->addAction(saveasaction);
    filemenu->addAction(closeaction);
    filemenu->addAction(delete_action);
}
