 #include "mainwindow.h"

    void MainWindow::menu_buttons(){

    strokeclrbtn=new QPushButton("Stroke color");
    connect(strokeclrbtn,&QPushButton::clicked,this,[this](){           //stroke color button for toolbar
        QColor c=QColorDialog::getColor(Qt::black,this,"select color");
        canvas->set_stroke_color(c);
    });

    fillcolorbtn=new QPushButton("fill color");
    connect(fillcolorbtn, &QPushButton::clicked,this,[this](){          //fill color button for toolbar
        QColor c=QColorDialog::getColor(Qt::white,this,"select color");
        canvas->set_fill_color(c);
    });

    slider=new QSlider(Qt::Horizontal);
    slider->setRange(1,20);                                             // slider for stroke width
    slider->setValue(1);
    connect(slider,&QSlider::valueChanged,this,[this](int value){
        canvas->set_stroke_width(value);
    });

    QToolButton* roundedRectBtn = new QToolButton();
    roundedRectBtn->setText("Rounded Rect");
    roundedRectBtn->setPopupMode(QToolButton::MenuButtonPopup);         //rounded rectangle button
    connect(roundedRectBtn, &QToolButton::clicked,[this]() {
        canvas->current_tool="Rounded_rect";
    });


   
    menu = new QMenu(this);
    QWidget* inputWidget = new QWidget();                        // Create menu with input fields
    QFormLayout* layout = new QFormLayout(inputWidget);
    layout->setContentsMargins(10, 10, 10, 10);

                                                                // Rx input for rounded rectangle
    QLabel* rxLabel = new QLabel("Rx:");
    QLineEdit* rxInput = new QLineEdit("20");  // Default 20px
    layout->addRow(rxLabel, rxInput);
    connect(rxInput, &QLineEdit::returnPressed, this, [=]() {
        canvas->setradx(rxInput->text().toDouble());
        canvas->update();
    });


                                                            // Ry input for rounded rectangle
    QLabel* ryLabel = new QLabel("Ry:");
    QLineEdit*  ryInput = new QLineEdit("20");
    layout->addRow(ryLabel, ryInput);
    connect(ryInput, &QLineEdit::returnPressed, this, [=]() {
        canvas->setrady(ryInput->text().toDouble());
        canvas->update();
    });

    QWidgetAction* widgetAction = new QWidgetAction(menu);
    widgetAction->setDefaultWidget(inputWidget);
    menu->addAction(widgetAction);  

    roundedRectBtn->setMenu(menu);

    menuBar()->addAction(cutaction);
    menuBar()->addAction(copyaction);                               //adding actions to menubar
    menuBar()->addAction(pasteaction);
    menuBar()->addAction(undoaction);
    menuBar()->addAction(redoaction);


    QToolButton* textBtn = new QToolButton();                       //text button
    textBtn->setText("Text");
    textBtn->setPopupMode(QToolButton::MenuButtonPopup);            // popup menu for font and size selection
    connect(textBtn, &QToolButton::clicked, [this]() {
        canvas->current_tool="Text";
    });

                                                                // Font size + family dropdown
    QMenu* textMenu=new QMenu(this);
    QWidget* fontWidget=new QWidget();
    QFormLayout* fontLayout=new QFormLayout(fontWidget);
    fontLayout->setContentsMargins(10,10,10,10);

                                                                    // Font size input
    QLabel* sizeLabel=new QLabel("Size:");
    fontSizeInput=new QSpinBox();
    fontSizeInput->setRange(8, 72);
    fontSizeInput->setValue(24);
    fontLayout->addRow(sizeLabel, fontSizeInput);
    QLabel* fontLabel=new QLabel("Font:");
    fontFamilyCombo=new QFontComboBox();
    fontLayout->addRow(fontLabel,fontFamilyCombo);

                                                                     // Add to menu via QWidgetAction
    QWidgetAction* fontAction = new QWidgetAction(textMenu);
    fontAction->setDefaultWidget(fontWidget);
    textMenu->addAction(fontAction);
    textBtn->setMenu(textMenu);
    toolbar->addWidget(textBtn);

    connect(fontSizeInput, QOverload<int>::of(&QSpinBox::valueChanged),     // sets font size input in canvas
            [this](int size) { canvas->setfontsize(size); });
    connect(fontFamilyCombo, &QFontComboBox::currentFontChanged,                    // sets font family in canvas
            [this](const QFont& font) { canvas->setfontfamily(font.family()); });

    toolbar->addWidget(roundedRectBtn);
    toolbar->addWidget(slider);
    toolbar->addWidget(fillcolorbtn);                               //adding widgets
    toolbar->addWidget(strokeclrbtn);
}
