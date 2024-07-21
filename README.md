# Minecraft 插件运行时测试
用于在 Paper 服务器的不同版本上测试 Minecraft 插件初始化的 Github Action。

![image](https://github.com/FN-FAL113/minecraft-plugin-runtime-test/assets/88238718/5086ee38-b1a3-4860-961a-1929124db85c)

### 工作原理
#### 先决条件步骤（构建插件）
1. 检出仓库（在 Action 调用者的上下文中）
2. 从之前的 workflow 构建作业中下载插件构建工件
3. 设置 Java 17
4. 设置 Node 16
5. 执行 index.js 文件

#### index.js（当此 Action 被调用时）
1. 创建并初始化 ```eula.txt```
2. 获取最新的 Paper 服务器构建
3. 下载 Paper 服务器 jar（服务器版本从矩阵变量作为输入数据传递给此 Action）
4. 执行 mc 服务器

### 使用方法
- 在你的插件仓库的 ```./github/workflows``` 目录下创建一个 Action 文件，并根据需要配置步骤：
```yml
name: 使用 Maven 构建并进行运行时测试

on:
  workflow_dispatch:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
    
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: 检出仓库
      uses: actions/checkout@v2.3.3
      
    - name: 设置 JDK 16
      uses: actions/setup-java@v1.4.3
      with:
        java-version: 16
        
    - name: Maven 构建
      run: mvn clean package --file pom.xml
      
    - name: 上传工件
      uses: actions/upload-artifact@v3
      with:
        name: artifact-${{ github.event.number }}
        path: 'target/FNAmplifications*.jar' # 根据你的打包 jar 的位置和文件名更改此路径，可以使用通配符

  runtime-test:
    name: 插件运行时测试 
    needs: [build]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - mcVersion: '1.16.5'
            javaVersion: '16'
          - mcVersion: '1.17.1'
            javaVersion: '17'
          - mcVersion: '1.18.2'
            javaVersion: '18'
          - mcVersion: '1.19.4'
            javaVersion: '19'
          - mcVersion: '1.20.1'
            javaVersion: '20'  
    
    steps:        
      - uses: FN-FAL113/minecraft-plugin-runtime-test@v1.1.2 # 指定 Action 版本，尽可能使用最新版本
        with:
          server-version: ${{ matrix.mcVersion }}
          java-version: ${{ matrix.javaVersion }}
          artifact-name: artifact-${{ github.event.number }}

```

### 默认包含的插件
- Slimefun
- GuizhanLibPlugin

对于依赖其他插件的插件，欢迎提出建议。这将在不久的将来基于资源文件实现，以便支持更多插件或允许此仓库被分叉以支持你的插件。

