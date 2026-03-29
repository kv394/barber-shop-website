# High Scalability Playbook
I have implemented an open-source Redis integration using `ioredis` which will safely serve cached payloads when available and bypass the standard database queue altogether. It will aggressively boost performance and easily support 1 million tenant hits assuming the memory boundary allows it. 
