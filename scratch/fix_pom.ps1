$poms = Get-ChildItem -Path services -Recurse -Filter pom.xml

foreach ($pom in $poms) {
    Write-Host "Processing $($pom.FullName)..."
    $content = [System.IO.File]::ReadAllText($pom.FullName)

    # 1. Clean up potential double additions from previous run
    # If it was added to dependencyManagement, it looks like:
    # <dependencyManagement><dependencies>...<dependency>byte-buddy</dependency></dependencies></dependencyManagement>
    # We want it to be ONLY in the main <dependencies> block.

    # Remove ALL byte-buddy dependencies first to start clean
    $content = [regex]::Replace($content, '(?s)<dependency>\s*<groupId>net.bytebuddy</groupId>\s*<artifactId>byte-buddy</artifactId>.*?</dependency>', "")

    # Now add it back once to the main <dependencies> block (which comes before <dependencyManagement>)
    # Find the FIRST </dependencies>
    $index = $content.IndexOf("</dependencies>")
    if ($index -ge 0) {
        $byteBuddy = @"
		<dependency>
			<groupId>net.bytebuddy</groupId>
			<artifactId>byte-buddy</artifactId>
			<version>1.17.5</version>
		</dependency>
"@
        $content = $content.Insert($index, $byteBuddy)
    }

    # 2. Ensure experimental flag in surefire
    if ($content -notmatch 'net.bytebuddy.experimental=true') {
        if ($content -match '<artifactId>maven-surefire-plugin</artifactId>') {
             $content = [regex]::Replace($content, '(?s)(<artifactId>maven-surefire-plugin</artifactId>.*?<configuration>)', "`$1`n`t`t`t`t`t<argLine>-Dnet.bytebuddy.experimental=true</argLine>")
        }
    }

    [System.IO.File]::WriteAllText($pom.FullName, $content)
}
