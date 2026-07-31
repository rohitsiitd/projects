cmake_minimum_required(VERSION 3.16)

project(basic VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
find_package(Qt6 REQUIRED COMPONENTS Widgets)

qt_standard_project_setup()

qt_add_executable(vector-editor
    WIN32 MACOSX_BUNDLE
    main.cpp
    ui/mainwindow.cpp
    ui/mainwindow.h
    ui/mainwindow.ui
    canvas/Canvas.h
    canvas/canvas.cpp
    shapes/graphics_object.h
    shapes/text.cpp
    utils/clipboard.cpp
    utils/undo_redo.cpp
    utils/menu_functions.cpp
    shapes/hexagon.cpp
    shapes/rectangle.cpp
    shapes/freehand.cpp
    shapes/circle.cpp
    shapes/line.cpp
    events/paintevent.cpp
    events/mousepressevent.cpp
    events/mousemoveEvent.cpp
    events/mouseReleaseEvent.cpp
    utils/svg_reader.cpp
    utils/selection_tool_helpers.cpp
    ui/Qaction_buttons.cpp
    ui/menu_buttons.cpp
)

target_link_libraries(vector-editor PRIVATE Qt${QT_VERSION_MAJOR}::Widgets)
target_include_directories(vector-editor PRIVATE
    canvas events shapes ui utils
)
set_target_properties(vector-editor PROPERTIES
    MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
    MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
)

include(GNUInstallDirs)
install(TARGETS vector-editor
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
