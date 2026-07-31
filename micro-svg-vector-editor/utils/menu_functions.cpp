#include "Canvas.h"

void Canvas::delete_fig(){
    if(!selected_item) return;                                                  // for delete key erase
    changed=true;
    savestate();
    for(auto it =store.begin();it!=store.end();it++){
        if(*it==selected_item){                                 //this function is specifically for delete key press erase
            store.erase(it);
            selected_item=NULL;
            update();
            return;

        }
    }
}

void Canvas::save(){
    if(filepath==""){                                           //calls save as if filepath is empty
        saveas();
    }
    else if(changed){
        std::ofstream out(filepath);                                //writes to svg
        out<<std::fixed<<std::setprecision(2);
        out << "<svg width=\"" <<800<< "\" height=\"" << 600<< "\" xmlns=\"http://www.w3.org/2000/svg\">\n";
        for(auto &val:store){
            out<<val->to_svg();
        }
        out << "</svg>\n";
        changed=false;
    }
}

void Canvas::saveas(){
    std::string filename=QFileDialog::getSaveFileName(this,"save SVG",""," SVG Files (.*svg)").toStdString();
    if(filename=="")return;
    filename+=".svg";                                   // appends .svg in filename

    std::ofstream out(filename);
    out<<std::fixed<<std::setprecision(2);                          //writes to svg
    out << "<svg width=\"" << 800<< "\" height=\"" << 600<< "\" xmlns=\"http://www.w3.org/2000/svg\">\n";
    for(auto &val:store){                                                                                   
        out<<val->to_svg();
    }
    out << "</svg>\n";
    changed=false;

    filepath=filename;                                               // sets the filepath
}
std::string Canvas::close(){
    if(!changed){return "";}
    else{
        QMessageBox::StandardButton reply =                             //Qmessagebox for closing interface
            QMessageBox::question(
                this,
                "Unsaved Changes",
                "You have unsaved changes. Save before closing?",
                QMessageBox::Yes | QMessageBox::No | QMessageBox::Cancel
                );

        if (reply == QMessageBox::Yes) {
            save();
        }
        else if(reply==QMessageBox::Cancel) {
            return "cancel";
        }
        return "";

    }
}
void Canvas::newcanvas(){
    if(changed){
        auto garbage=close();}                   //save warning on creating a new file
    filepath="";
    changed=false;
    store.clear();
    drawing=false;
    selected_item=NULL;
    undo_deque.clear();
    redo_deque.clear();
    copied_item=NULL;
    update();

}
void Canvas::open(){
    if(changed){
        auto garbage=close();
    }
    std::string filename=QFileDialog::getOpenFileName(  this,"Open SVG","","SVG Files (*.svg)").toStdString();
    if(filename==""){return;}
    filepath=filename;
    changed=false;                                  // QFileDialog for navigating to the filepath
    selected_item=NULL;
    undo_deque.clear();
    redo_deque.clear();
    store.clear();
    drawing=false;
    readsvg();
    update();
}
