        uniqueVal = {}
        maxHeap = []
        # for i in range(len(tasks)):
        #     uniqueVal[tasks[i]] = uniqueVal.get(tasks[i],0) +1
        # for k,v in uniqueVal.items():
        #     maxHeap.append(v*-1)
        uniqueVals = Counter(tasks)
        maxHeap = [-1*count for count in uniqueVals.values()]
        print(maxHeap)
        heapq.heapify(maxHeap)
        queue = deque()
        res = 0
        while maxHeap or queue:
            res+=1
            if maxHeap:
                val = heapq.heappop(maxHeap)
                val = val+1
                if val<0:
                    queue.append([val,res+n])
            if queue and queue[0][1] == res:
                val, free = queue.popleft()
                heapq.heappush(maxHeap,val)
            
        return res