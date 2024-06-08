
SERIAL_WEBSOCKET_CMD="cd $PWD/../serial-websocket && npm run start"
BUILD_CONTROLLER_CMD="cd $PWD && npm run build"
SERVE_CONTROLLER_CMD="cd $PWD && python3 -m http.server"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then

    for terminal in "$TERMINAL" x-terminal-emulator mate-terminal gnome-terminal terminator xfce4-terminal urxvt rxvt termit Eterm aterm uxterm xterm roxterm termite lxterminal terminology st qterminal lilyterm tilix terminix konsole kitty guake tilda alacritty hyper wezterm rio; do
        if command -v "$terminal" > /dev/null 2>&1; then
            exec "$terminal" "$SERIAL_WEBSOCKET_CMD"
            if [[ $1 == "dev" ]] ; then
                exec "$terminal" "$BUILD_CONTROLLER_CMD"
                break
            fi
            exec "$terminal" "$SERVE_CONTROLLER_CMD"
            chromium --kiosk http://localhost:8000
        fi
    done
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    
    # Mac OSX

    # Start serial-websocket
    osascript -e "tell app \"Terminal\" to do script \"$SERIAL_WEBSOCKET_CMD\""

    # Build tipibot-controller-gui if in dev mode
    if [[ $1 == "dev" ]] ; then
        osascript -e "tell app \"Terminal\" to do script \"$BUILD_CONTROLLER_CMD\""
        break
    fi

    # Launch a server to serve tipibot-controller-gui on localhost:8000
    osascript -e "tell app \"Terminal\" to do script \"$SERVE_CONTROLLER_CMD\""

    # Open chromium windows @ localhost:8000
    chromium --kiosk http://localhost:8000


elif [[ "$OSTYPE" == "cygwin" ]]; then
        # POSIX compatibility layer and Linux environment emulation for Windows
        echo $OSTYPE
elif [[ "$OSTYPE" == "msys" ]]; then
        # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
        GIT_BASH=C:\Program Files\Git\git-bash.exe

        $GIT_BASH $SERIAL_WEBSOCKET_CMD
        if [[ $1 == "dev" ]] ; then
            $GIT_BASH $BUILD_CONTROLLER_CMD
            break
        fi
        $GIT_BASH $SERVE_CONTROLLER_CMD
        chromium --kiosk http://localhost:8000

        echo $OSTYPE
elif [[ "$OSTYPE" == "win32" ]]; then
        echo $OSTYPE
elif [[ "$OSTYPE" == "freebsd"* ]]; then
        echo $OSTYPE
else
        echo $OSTYPE
fi


