import { Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect, useRef, useState } from "react";
import { PodDetailsSpec, PodSocketResponse } from "@/types";
import { getColorForContainerName, getEventStreamUrl } from "@/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import Highlighter from "react-highlight-words";
import { RootState } from "@/redux/store";
import { SearchAddon } from "@xterm/addon-search";
import { Terminal } from "@xterm/xterm";
import XtermTerminal from "../Xterm";
import { addLog } from "@/data/Workloads/Pods/PodLogsSlice";
import { useEventSource } from "@/components/app/Common/Hooks/EventSource";

// import useWebSocket from 'react-use-websocket';

type SocketLogsProps = {
  pod: string;
  namespace: string;
  containerName: string;
  configName: string;
  clusterName: string;
  podDetailsSpec: PodDetailsSpec;
  updateLogs: (currentLog: PodSocketResponse) => void;
  searchAddonRef: MutableRefObject<SearchAddon | null>;
}

export function SocketLogs({ pod, containerName, namespace, configName, clusterName, podDetailsSpec, searchAddonRef,updateLogs }: SocketLogsProps) {
  const dispatch = useAppDispatch();
  // const { logs } = useAppSelector((state: RootState) => state.podLogs);
  const porotocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
  const port = process.env.NODE_ENV === 'production' ?  window.location.port : '7080';
  // const [socketUrl, setSocketUrl] = useState(`${porotocol}//${window.location.hostname}:${port}/api/v1/pods/${pod}/logsWS?namespace=${namespace}&all-containers=true&config=${configName}&cluster=${clusterName}`);
  // const { lastMessage } = useWebSocket(socketUrl);
  const [localContainerName, setLocalContainerName] = useState(containerName);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [currenVal, setCurrentVal] = useState<PodSocketResponse>({} as PodSocketResponse);
  const xterm = useRef<Terminal | null>(null);
  // useEffect(() => {
  //   if (lastMessage !== null) {
  //     // dispatch(addLog(JSON.parse(lastMessage.data)));
  //   }
  // }, [lastMessage, dispatch]);

  // useEffect(() => {
  //   if (isFollowingLogs) {
  //     if (!logContainerRef.current) return;
  //     // Scroll to the bottom of the log container when isFollowingLogs changes
  //     logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  //   }
  // }, [isFollowingLogs]);

  // useEffect(() => {
  //   let containerQuery = '&all-containers=true';
  //   if (containerName) {
  //     containerQuery = `&container=${containerName}`;
  //   }
  //   setSocketUrl(`${porotocol}//${window.location.hostname}:${port}/api/v1/pods/${pod}/logsWS?namespace=${namespace}${containerQuery}&config=${configName}&cluster=${clusterName}`);
  //   if (logs.length > 0 && localContainerName !== containerName) {
  //     dispatch(addLog([{ containerName: containerName, log: '', containerChange: true }]));
  //     setLocalContainerName(containerName);
  //   }
  // }, [pod, containerName, namespace, dispatch]);

  const printLogLine = (message: PodSocketResponse) => {
    if (xterm.current) {
      const containerColor = getColorForContainerName(message.containerName, podDetailsSpec)
      // const levelColor = level === 'error' ? '\x1b[31m' : '\x1b[32m'; // Red for error, Green for other levels
      const resetCode = '\x1b[0m'; // Reset formatting
      const smallerText = '\x1b[2m'; // ANSI escape code for dim (which may simulate a smaller font)
      const resetSmallText = '\x1b[22m'; // Reset for dim text
      // Print the message with the background color
      xterm.current.writeln(`${smallerText}${message.timestamp}${resetSmallText} ${containerColor}${message.containerName}${resetCode} ${message.log}`);
    }
  };
  const sendMessage = (lastMessage: PodSocketResponse) => {
    // console.log('-->', lastMessage)
    if(!!lastMessage.log) {
      if(!containerName || lastMessage.containerName === containerName){
        // setCurrentVal(lastMessage as PodSocketResponse);
        printLogLine(lastMessage as PodSocketResponse)
        updateLogs(lastMessage)
        // xterm.current?.writeln(lastMessage.log)
        // dispatch(addLog(lastMessage));
      }
    }
    // dispatch(addLog(lastMessage));
  };
// console.log('parent,', containerName)
  useEventSource({
    url: getEventStreamUrl(`pods/${pod}/logs`, {
      namespace,
      config: configName,
      cluster: clusterName,
      ...(
        containerName ? {container: containerName} : {'all-containers': 'true'}
      )
    }),
    sendMessage,
  });

  useEffect(() => {
    console.log('--->')
    // setCurrentVal({log: `-------------------${containerName || 'All Containers'}-------------------`} as PodSocketResponse)
  },[containerName])
// console.log('currenVal', currenVal)
  return (
    <div ref={logContainerRef} className="m-2">
      {/* {
        logs.length == 0 &&
        <div className="empty-table flex items-center justify-center text-sm">
          No Logs.
        </div>
      } */}
      <XtermTerminal
        log={[currenVal]}
        podDetailsSpec={podDetailsSpec}
        containerNameProp={containerName}
        xterm={xterm}
        searchAddonRef={searchAddonRef}
        updateLogs={updateLogs}
      />
      {/* {
        logs.map((message, index) => {
          return (
            <div className='' key={message.log + index}>
              {
                message.containerChange ? (
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-dashed border-t border-gray-400"></div>
                    <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground">{message.containerName || 'All Containers'}</span>
                    <div className="flex-grow border-dashed border-t border-gray-400"></div>
                  </div>
                ) : (
                  <>
                    <span className='text-xs font-medium text-muted-foreground'>
                      <Highlighter
                        highlightClassName="bg-amber-200"
                        searchWords={[podLogSearch]}
                        autoEscape={true}
                        textToHighlight={`${message.timestamp} `}
                      />
                    </span>
                    <span className='text-xs font-medium text-muted-foreground'>
                      <Highlighter
                        highlightClassName="bg-amber-200"
                        searchWords={[podLogSearch]}
                        autoEscape={true}
                        textToHighlight={`[${message.containerName}]:`}
                        className={getColorForContainerName(message.containerName, podDetailsSpec)}
                      />
                    </span>
                    <span className="text-sm font-normal break-all">
                      <Highlighter
                        highlightClassName="bg-amber-200"
                        searchWords={[podLogSearch]}
                        autoEscape={true}
                        textToHighlight={message.log}
                      />
                    </span>
                  </>
                )
              }
            </div>
          );
        })
      } */}
    </div>
  );
}