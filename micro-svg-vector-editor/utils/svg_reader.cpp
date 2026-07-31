#include "Canvas.h"

void Canvas::readsvg(){
    std::ifstream f(filepath);
    char c;
    while(true){
        std::string temp;
        while(c!='<')f.get(c);
        f.get(c);
        while(c!='>'){                                      // extracts string contained withing tags <>
            if(c!='\n'){temp.push_back(c);}
            f.get(c);
        }
        std::string cast;
        if(temp=="/svg")break;            //end of svg file
        double strokeWidth ;
        QColor strokeColor = QColor::fromString(QString::fromStdString(extract(temp,"stroke=")));
        cast=extract(temp,"stroke-width=");                         // getting stroke color,fill color and stroke width
        if(cast.size()>0)strokeWidth=std::stod(cast);             //   via extract method
        QColor fillColor = QColor::fromString(QString::fromStdString(extract(temp,"fill=")));
        if(!temp.empty() && temp[0]=='s'){
            int w,h;
            w=std::stoi(extract(temp,"width"));
            h=std::stoi(extract(temp,"height"));
           

        }
        else if(!temp.empty() && temp[0]=='r'){
            int x,y,width,height;
            double rx,ry;
            std::string checker;                                            //for <rect>
            rx=0.0;
            ry=0.0;
            x=std::stod(extract(temp,"x="));
            y=std::stod(extract(temp,"y="));
            width=std::stod(extract(temp,"width="));
            height=std::stod(extract(temp,"height="));
            checker=extract(temp,"rx=");
            if(checker.size()!=0){rx=std::stod(checker);}
            checker=extract(temp,"ry=");
            if(checker.size()!=0){ry=std::stod(checker);}
            QRect rec(x,y,width,height);
            store.push_back(std::make_shared<Rectangle>(rec,fillColor,strokeColor,strokeWidth,rx,ry));
        }
        else if(!temp.empty() && temp[0]=='l'){
            double x1,x2,y1,y2;
            x1=std::stod(extract(temp,"x1="));          // for <line>
            y1=std::stod(extract(temp,"y1="));
            x2=std::stod(extract(temp,"x2="));
            y2=std::stod(extract(temp,"y2="));
            store.push_back(std::make_shared<Line>(QLine(QPoint(x1,y1),QPoint(x2,y2)),fillColor,strokeColor,strokeWidth));
        }
        else if(!temp.empty() && temp[0]=='c'){
            double cx,cy,r;
            cx=std::stod(extract(temp,"cx="));              // for <circle>
            cy=std::stod(extract(temp,"cy="));
            r=std::stod(extract(temp,"r="));
            store.push_back(std::make_shared<Circle>(QPoint(cx,cy),r,fillColor,strokeColor,strokeWidth));


        }
        else if(!temp.empty() && temp[0]=='t'){
            double x,y;
            std::string font_family,text;
            int font_size;                                          //for <text>
            x=std::stod(extract(temp,"x="));
            y=std::stod(extract(temp,"y="));
            int font__size=std::stoi(extract(temp,"font-size="));
            font_family=extract(temp,"font-family=");

            QString hui;
            f.get(c);
            while(c!='<'){
                hui.push_back(c);
                f.get(c);    }
            c='/';
            QFont fo_pas=QFont(QString::fromStdString(font_family),font__size);
            store.push_back(std::make_shared<Text>(QPointF(x,y),hui,fo_pas,fillColor,strokeColor,strokeWidth));

        }
        else if(!temp.empty() && temp.size()>5 && temp[0]=='p' && temp[4]=='g' ){
            std::vector<double> xi,yi;
            std::string nums=extract(temp,"polygon");                                       // for <polygon>
            int i=0;
            for(int j=0;j<6;j++){
                std::string first;
                while(i<nums.size() && nums[i]!=','){if(nums[i]==' '){i++;continue;}first.push_back(nums[i]);i++;}
                xi.push_back(std::stod(first));
                i++;first.clear();
                while(i<nums.size() && nums[i]!=','){if(nums[i]==' '){i++;continue;}first.push_back(nums[i]);i++;}
                yi.push_back(std::stod(first));
                while(i<nums.size() && (nums[i]==' ' || nums[i]==',')){i++;}

            }

            store.push_back(std::make_shared<Hexagon>(xi,yi,fillColor,strokeColor,strokeWidth));
        }
        else if (temp.size() > 5 && temp[0] == 'p' && temp[5] == 'd') {
            std::string nums = extract(temp, "path");                       // for <path>                                             
            int i = 0;
            bool firstPoint = true;
            QPainterPath path;

            while (i<nums.size()) {
                std::string xs, ys;
                if(nums[i]=='M' || nums[i]=='L'){i+=2;}

                // read x
                while (i<nums.size() && nums[i] != ' ') {
                  xs.push_back(nums[i]);
                    i++;
                }
                i++;
                // read y
                while (i < nums.size() && nums[i] != ' ') {
                    ys.push_back(nums[i]);
                    i++;}
                // skip spaces
                while (i < nums.size() && nums[i] == ' ') i++;
                QPointF pt(std::stod(xs), std::stod(ys));
                if (firstPoint) {
                    path.moveTo(pt);
                    firstPoint = false;
                } else {
                    path.lineTo(pt);
                }
            }

            store.push_back(std::make_shared<Freehand>(
                path,
                fillColor,
                strokeColor,
                strokeWidth
                ));
        }
        temp.clear();
    }

}

std::string Canvas::extract(std::string &temp,const std::string &match){
    std::string ans;
    int n=temp.size();                                      // finds the first occurence of match within temp
    int m=match.size();                                     // and extracts the values contained within "" double quotes
    int j=0;                                                // just after the first occurence of match
    for(int i=0;i<n;i++){                           //for example- extract(hello="2020" ,hello) will return "2020"
        int k=i;
        j=0;
        bool flag=true;
        while(k<n && j<m ){
            if(temp[k]==match[j]){k++;j++;}
            else{
                flag=false;
                break;
            }
        }
        if(flag){
            while(i<n && temp[i]!='"'){i++;}
            i++;
            while(i<n && temp[i]!='"'){
                ans.push_back(temp[i]);
                i++;
            }
            return ans;}

    }
    return ans;
}
