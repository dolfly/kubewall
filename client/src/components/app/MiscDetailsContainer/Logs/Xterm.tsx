import '@xterm/xterm/css/xterm.css';

import { ArrowDownToLine, ChevronDown, ChevronsDown, SaveIcon } from 'lucide-react';
import { Dispatch, MutableRefObject, RefObject, SetStateAction, useDebugValue, useEffect, useRef, useState } from 'react';
import { PodDetailsSpec, PodSocketResponse } from '@/types';
import { addLog, clearLogs } from '@/data/Workloads/Pods/PodLogsSlice';
import { getColorForContainerName, getSystemTheme } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';

import { Button } from '@/components/ui/button';
import { FitAddon } from '@xterm/addon-fit';
import { RootState } from '@/redux/store';
import { SearchAddon } from '@xterm/addon-search';
import { Terminal } from '@xterm/xterm';

type XtermProp = {
  log: PodSocketResponse[];
  podDetailsSpec: PodDetailsSpec;
  containerNameProp: string;
  updateLogs: (currentLog: PodSocketResponse) => void;
  xterm: MutableRefObject<Terminal | null>
  searchAddonRef: MutableRefObject<SearchAddon | null>
};

const XtermTerminal = ({ log, podDetailsSpec, containerNameProp, xterm, searchAddonRef,updateLogs }: XtermProp) => {
  const dispatch = useAppDispatch();
  const terminalRef = useRef<HTMLDivElement | null>(null);

  const fitAddon = useRef<FitAddon | null>(null);
  // const searchAddon = useRef<SearchAddon | null>(null);
  // const { isFollowingLogs } = useAppSelector((state: RootState) => state.podLogs);
  const [lineNumber, setLineNumber] = useState(0); // Track line number
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);



  useEffect(() => {
    if (xterm?.current && log.length) {
      // console.log('length', log.length)
      log.forEach(({ log, containerName, timestamp }) => {
        if(log && (!containerNameProp || containerNameProp === containerName)) {
          xterm.current && printLogLine({ log, containerName, timestamp });
          // updateLogs({containerName: containerNameProp, log, timestamp})
                    // dispatch(addLog({containerName: containerNameProp, log, timestamp}));
        }

        // if(isFollowingLogs) {
        // }
      });
    }
    // console.log(log[0].log)
  }, [log]);

  // useEffect(() => {
  //   if (isFollowingLogs) {
  //     const xtermContainer = document.querySelector('.xterm-viewport');
  //     if (xtermContainer) {
  //       xtermContainer.scrollTop = xtermContainer.scrollHeight;
  //       // dispatch(setIsFollowingLogs(false))
  //     }
  //   }
  // }, [isFollowingLogs]);

  useEffect(() => {
    const newContainer = `-------------------${containerNameProp || 'All Containers'}-------------------`;
    xterm?.current?.writeln(newContainer)
    updateLogs({log: newContainer} as PodSocketResponse)
    // console.log('containerName',containerNameProp)
  },[containerNameProp])
  const scrollToBottom = () => {
    const xtermContainer = document.querySelector('.xterm-viewport');
    if (xtermContainer) {
      xtermContainer.scrollTop = xtermContainer.scrollHeight;
      // dispatch(setIsFollowingLogs(false))
    }
  }


  const printLogLine = (message: PodSocketResponse) => {
    if (xterm.current) {
      const containerColor = getColorForContainerName(message.containerName, podDetailsSpec)
      // const levelColor = level === 'error' ? '\x1b[31m' : '\x1b[32m'; // Red for error, Green for other levels
      const resetCode = '\x1b[0m'; // Reset formatting
      const smallerText = '\x1b[2m'; // ANSI escape code for dim (which may simulate a smaller font)
      const resetSmallText = '\x1b[22m'; // Reset for dim text
      // Print the message with the background color
      xterm.current.writeln(`${smallerText}${message.timestamp}${resetSmallText} ${containerColor}${message.containerName}${resetCode} ${message.log}`);
      setLineNumber((prev) => prev + 1); // Increment line number for alternating
    }
  };
  const darkTheme = {
    background: '#181818',        // Dark gray background
    foreground: '#dcdcdc',        // Light gray text
    cursor: '#dcdcdc',            // Light gray cursor
    selectionBackground: '#404040', // Darker gray for text selection
  };
  const lightTheme = {
    background: '#ffffff',        // White background for light theme
    foreground: '#333333',        // Dark text for readability
    cursor: '#333333',            // Dark cursor
    selectionBackground: '#bbbbbb', // Light gray for text selection
  };

  useEffect(() => {
    if (terminalRef.current && xterm) {
      xterm.current = new Terminal({
        cursorBlink: false,
        theme: getSystemTheme() === 'light' ? lightTheme : darkTheme,
        scrollback: 9999999
      });

      fitAddon.current = new FitAddon();
      searchAddonRef.current = new SearchAddon();
      xterm.current.loadAddon(fitAddon.current);
      xterm.current.loadAddon(searchAddonRef.current);
      xterm.current.open(terminalRef.current);

      // Fit the terminal to the container
      fitAddon.current.fit();

      // Resize the terminal on window resize
      const handleResize = () => fitAddon.current?.fit();
      window.addEventListener('resize', handleResize);
      const xtermContainer = document.querySelector('.xterm-viewport');

      const checkIfBottom = () => {
        const xtermContainer = document.querySelector('.xterm-viewport');
        if(xtermContainer && xtermContainer?.clientHeight + xtermContainer?.scrollTop < xtermContainer.scrollHeight) {
          setShowScrollDown(true);
        } else {
          setShowScrollDown(false)
        }
      }
      xtermContainer?.addEventListener('scroll', checkIfBottom);
      return () => {
        console.log('delet')
        xterm.current?.dispose();
        window.removeEventListener('resize', handleResize);
        xtermContainer?.removeEventListener('scroll', checkIfBottom);

        dispatch(clearLogs());
      };
    }
  }, []);

  return (
    <div className="w-full h-full">
      {
        showScrollDown &&
        <Button
          variant="default"
          size="icon"
          className='absolute bottom-7 right-0 mt-1 mr-9 rounded z-10 border'
          onClick={scrollToBottom}
        >  <ChevronsDown className="h-4 w-4" />
        </Button>
      }

      <div ref={terminalRef} />
    </div>
  );
};

export default XtermTerminal;
